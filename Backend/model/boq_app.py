import base64
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import uvicorn
from typing import Optional
from pydantic import BaseModel

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


class BOQRequest(BaseModel):
    takeoff_data: str
    project_name: Optional[str] = None
    location: Optional[str] = None
    client: Optional[str] = None


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
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """Provide a detailed take-off of the quantities from this engineering drawing.
                        Return your analysis as a structured table with pipe separators (|) like this:
                        
                        | Item | Description | Unit | Quantity |
                        |------|-------------|------|----------|
                        | 1    | Walls       | m²   | 450      |
                        
                        Include all dimensions, areas, volumes, and counts that are relevant to quantity surveying in Sri Lanka.
                        Make your table comprehensive with appropriate section headings and organized categories."""
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


@app.post("/generate-boq/")
async def generate_boq(data: BOQRequest):
    """
    Generate a Bill of Quantities (BOQ) from the take-off data
    """
    try:
        # Prepare the prompt for generating the BOQ
        project_context = f"""
        Project: {data.project_name or 'Construction Project'}
        Location: {data.location or 'Not specified'}
        Client: {data.client or 'Not specified'}
        """

        # Call OpenAI API to generate BOQ
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """You are a professional quantity surveyor in Sri Lanka. Your task is to create a detailed Bill of Quantities (BOQ) 
                    from take-off data. Include item codes, descriptions, units, quantities, rates, and amounts. 
                    Make reasonable assumptions for rates based on current Sri Lankan market prices in Sri Lankan Rupees (LKR). 
                    Organize by CSI MasterFormat divisions or CIDA standards for Sri Lanka.
                    
                    Format your output as a well-structured table with column headers for Item Code, Description, Unit, Quantity, Rate (LKR), and Amount (LKR).
                    Use pipe characters (|) to separate columns for better parsing, like this:
                    
                    | Item Code | Description | Unit | Quantity | Rate (LKR) | Amount (LKR) |
                    |-----------|-------------|------|----------|------------|--------------|
                    | 1.1       | Excavation  | m³   | 100      | 1,500      | 150,000      |
                    
                    Make sure all numeric values are properly aligned and formatted with thousands separators.
                    Include subtotals for each section and a grand total at the end.
                    """
                },
                {
                    "role": "user",
                    "content": f"""
                    {project_context}
                    
                    Here is the take-off data from the drawing:
                    
                    {data.takeoff_data}
                    
                    Please create a complete Bill of Quantities (BOQ) with the following:
                    1. Item codes/references
                    2. Detailed descriptions
                    3. Units of measurement
                    4. Quantities (from the take-off data)
                    5. Estimated unit rates (in LKR - Sri Lankan Rupees)
                    6. Calculated amounts (quantity × rate)
                    7. Subtotals for each section
                    8. Grand total

                    Format it as a well-structured table that could be directly used in a professional construction document in Sri Lanka.
                    """
                }
            ]
        )
        
        boq_result = response.choices[0].message.content
        
        return {
            "result": boq_result,
            "project_info": {
                "project_name": data.project_name,
                "location": data.location,
                "client": data.client
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating BOQ: {str(e)}")


@app.post("/estimate-costs/")
async def estimate_costs(file: UploadFile = File(...)):
    """
    Combined endpoint to analyze drawing and generate cost estimates in one step
    """
    try:
        # Read file and encode to base64
        image_bytes = await file.read()
        base64_image = base64.b64encode(image_bytes).decode("utf-8")

        # Step 1: Get take-off data from the drawing
        takeoff_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """Provide a comprehensive take-off of the quantities from this engineering drawing.
                            Analyze all visible elements, dimensions, and specifications.
                            
                            Format your response as a well-structured table with pipe separators (|) like this:
                            
                            | Item | Description | Unit | Quantity |
                            |------|-------------|------|----------|
                            | 1    | Walls       | m²   | 450      |
                            
                            Include separate sections for different building elements (foundations, walls, floors, roofing, etc.)
                            Use standard units appropriate for construction in Sri Lanka."""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ]
        )
        
        takeoff_result = takeoff_response.choices[0].message.content
        
        # Step 2: Generate BOQ with cost estimates from take-off data
        boq_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """You are a professional quantity surveyor and cost estimator in Sri Lanka. Create a detailed Bill of Quantities (BOQ) 
                    with realistic cost estimates for the Sri Lankan construction market. Include item codes, detailed descriptions, units, quantities, unit rates in LKR (Sri Lankan Rupees), and amounts. 
                    Add appropriate preliminaries, overhead and profit as per Sri Lankan construction standards. Structure according to CIDA (Construction Industry Development Authority) or ICTAD standards.
                    
                    Format your output as a well-structured table with pipe separators for better parsing, like this:
                    
                    | Item Code | Description | Unit | Quantity | Rate (LKR) | Amount (LKR) |
                    |-----------|-------------|------|----------|------------|--------------|
                    | 1.1       | Excavation  | m³   | 100      | 1,500      | 150,000      |
                    
                    Make sure to include:
                    - Properly aligned columns
                    - Thousands separators in numeric values
                    - Subtotals for each section
                    - Markup calculations clearly shown
                    - Grand total at the end
                    """
                },
                {
                    "role": "user",
                    "content": f"""
                    Here is the take-off data from the engineering drawing:
                    
                    {takeoff_result}
                    
                    Create a complete Bill of Quantities (BOQ) with cost estimates that includes:
                    1. Item codes
                    2. Detailed descriptions of works
                    3. Units of measurement
                    4. Quantities 
                    5. Realistic unit rates (in LKR - Sri Lankan Rupees)
                    6. Calculated amounts
                    7. Subtotals for each section
                    8. Preliminaries (10%)
                    9. Overhead and profit (15%)
                    10. Contingency (5%)
                    11. Grand total

                    Format as a professional BOQ table that could be presented to clients in Sri Lanka.
                    """
                }
            ]
        )
        
        boq_with_costs = boq_response.choices[0].message.content
        
        return {
            "takeoff_data": takeoff_result,
            "boq_with_costs": boq_with_costs
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")


# Run the server directly
if __name__ == "__main__":
    uvicorn.run("boq_app:app", host="0.0.0.0", port=8001, reload=True)
