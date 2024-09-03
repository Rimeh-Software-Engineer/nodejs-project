import pandas as pd
from surprise import Dataset, Reader, SVD, accuracy
from surprise.model_selection import train_test_split
import joblib

# Function to fetch ratings data
def fetch_ratings():
    return pd.read_csv('public/ratings_data.csv')

# Load data
ratings = fetch_ratings()

# Prepare data for Surprise
reader = Reader(rating_scale=(1, 5))
data = Dataset.load_from_df(ratings[['userId', 'productId', 'rating']], reader)
trainset, testset = train_test_split(data, test_size=0.2)

# Build and train the model
model = SVD()
model.fit(trainset)

# Evaluate the model
predictions = model.test(testset)
print(f"RMSE: {accuracy.rmse(predictions)}")

# Save the trained model
joblib.dump(model, 'recommendation_model.pkl')
