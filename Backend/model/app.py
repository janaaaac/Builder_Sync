import base64
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import uvicorn

app = FastAPI()

# Allow all origins (update this for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with your React app domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your OpenAI API Key
client = OpenAI(api_key="YOUR_API_KEY")  # <-- Replace with your actual key

@app.post("/analyze-drawing/")
async def analyze_drawing(file: UploadFile = File(...)):
    # Read file and encode to base64
    image_bytes = await file.read()
    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    # Call OpenAI API
    stream = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": """You are a quantity surveying expert specializing in Sri Lankan construction.
                Analyze engineering drawings to provide precise take-off quantities following Sri Lankan construction standards.
                Format your output in clear, well-structured tables with detailed descriptions and accurate measurements."""
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """Provide a detailed quantity take-off analysis of this engineering drawing.
                        Include all relevant measurements, counts, and dimensions.
                        
                        Format your response as a well-structured table with pipe separators (|) like this:
                        
                        | Item | Description         | Unit | Quantity  |
                        |------|---------------------|------|---------- |
                        | 1.1  | Concrete foundation | m³   | 45.6      |
                        | 1.2  | Steel reinforcement | kg   | 1200     |

                        Group items by categories (e.g., Earthwork, Concrete, Masonry, etc.)
                        Include subtotals for each category where appropriate.
                        Use units according to Sri Lankan construction practices."""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        stream=True
    )

    # Collect and return result
    result = ""
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            result += chunk.choices[0].delta.content

    return {"result": result}

# Run the server directly
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
