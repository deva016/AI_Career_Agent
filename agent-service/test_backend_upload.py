import requests

url = "http://localhost:8000/api/resumes/upload"
headers = {"X-User-Email": "user_39DIiHUCQytEblMGmhe14cIaqjj"}
files = {"file": ("dummy.txt", open("dummy.txt", "rb"), "text/plain")}

response = requests.post(url, headers=headers, files=files)
print(f"Status: {response.status_code}")
print(f"Body: {response.json()}")
