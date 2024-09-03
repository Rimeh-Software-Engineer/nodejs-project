import json
import sys
import joblib
import pandas as pd
from surprise import Dataset, Reader

# Load the trained model
try:
    model = joblib.load('recommendation_model.pkl')
except FileNotFoundError:
    print(json.dumps({"error": "The model file 'recommendation_model.pkl' was not found."}))
    sys.exit(1)
except Exception as e:
    print(json.dumps({"error": f"Error loading model: {e}"}))
    sys.exit(1)

# Fetch the ratings data
def fetch_ratings():
    try:
        return pd.read_csv('public/ratings_data.csv')  # Update this path
    except FileNotFoundError:
        print(json.dumps({"error": "The ratings data file 'public/ratings_data.csv' was not found."}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Error reading ratings data: {e}"}))
        sys.exit(1)

ratings = fetch_ratings()

# Prepare data for Surprise
reader = Reader(rating_scale=(1, 5))
data = Dataset.load_from_df(ratings[['userId', 'productId', 'rating']], reader)
trainset = data.build_full_trainset()

# Get recommendations for a given user
def get_recommendations(user_id, num_recommendations=5):
    recommendations = []
    try:
        user_inner_id = trainset.to_inner_uid(user_id)
        user_ratings = trainset.ur[user_inner_id]
        
        for item_id in trainset.all_items():
            if item_id not in [item_id for (item_id, _) in user_ratings]:
                try:
                    est_rating = model.predict(user_id, trainset.to_raw_iid(item_id)).est
                    raw_item_id = trainset.to_raw_iid(item_id)  # Convert to the actual product ID
                    recommendations.append({"item_id": raw_item_id, "predicted_rating": est_rating})
                except Exception as e:
                    print(json.dumps({"error": f"Error predicting for item {item_id}: {e}"}))
    
        recommendations.sort(key=lambda x: x["predicted_rating"], reverse=True)
        return recommendations[:num_recommendations]
    except Exception as e:
        print(json.dumps({"error": f"Error in recommendation generation: {e}"}))
        return []

# Get recommendations for all users
def get_recommendations_for_all_users(num_recommendations=5):
    all_recommendations = {}
    user_ids = trainset.all_users()
    for user_inner_id in user_ids:
        user_id = trainset.to_raw_uid(user_inner_id)  # Convert to actual user ID
        all_recommendations[user_id] = get_recommendations(user_id, num_recommendations)
    return all_recommendations

# Get user ID from command line arguments
try:
    user_id = sys.argv[1]  # Handle user ID as a string
    recommendations = get_recommendations(user_id)
    output = {
        "ratings_head": ratings.head().to_dict(),
        "available_user_ids": list(ratings['userId'].unique()),
        "recommendations": recommendations
    }
except IndexError:
    # No user ID provided, generate for all users
    all_recommendations = get_recommendations_for_all_users()
    output = all_recommendations

# Print all output as a single JSON object
print(json.dumps(output))
