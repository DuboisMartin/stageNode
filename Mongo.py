from pymongo import MongoClient
import pprint
client = MongoClient('localhost', 27017)
db = client.test 
collection = db.test
posts = db.posts
post = {"author": "mike"}
post_id = posts.insert_one(post).inserted_id
pprint.pprint(posts.find_one())