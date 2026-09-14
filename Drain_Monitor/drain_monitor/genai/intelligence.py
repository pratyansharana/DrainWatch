"""
GenAI City Intelligence Engine extracting structured flood events from unstructured human reports.
"""

import os
import re
import json
import logging
import datetime
import requests
from pydantic import BaseModel, Field
from drain_monitor.config import LANDMARKS

logger = logging.getLogger(__name__)

class CityReportEvent(BaseModel):
    location: str = Field(..., description="Identified landmark or road segment")
    event: str = Field(..., description="Classified event category (e.g. drain_blockage, construction, waterlogging)")
    event_type: str = Field(..., description="Classified event category alias")
    blockage_ratio: float = Field(default=0.0, description="Estimated drain blockage ratio 0.0-1.0")
    road_capacity_reduction: float = Field(default=0.0, description="Estimated road capacity reduction 0.0-1.0")
    confidence: float = Field(default=0.88, description="Confidence score of extracted report")
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now().isoformat(), description="ISO timestamp")
    source: str = Field(default="citizen_report", description="Information source classification")
    raw_text: str = Field(..., description="Original input report string")

class GenAICityIntelligenceEngine:
    """
    Parses unstructured text/citizen reports into structured actionable flood events
    using Mistral AI API (if MISTRAL_API_KEY is available) with rule-based fallback.
    """
    def __init__(self, api_key: str = None, model: str = None):
        self.landmarks = list(LANDMARKS.keys())
        self.api_key = api_key or os.getenv("MISTRAL_API_KEY")
        self.model = model or os.getenv("MISTRAL_MODEL", "open-mistral-7b")
        self.api_url = "https://api.mistral.ai/v1/chat/completions"

    def process_report(self, text_report: str) -> CityReportEvent:
        """
        Parses human report text into structured JSON event payload.
        Uses Mistral LLM if API key is set; falls back to heuristic parser otherwise.
        """
        if self.api_key:
            try:
                return self._process_report_with_mistral(text_report)
            except Exception as e:
                logger.warning(f"Mistral API call failed ({e}), falling back to heuristic NLP parser.")
        
        return self._process_report_rule_based(text_report)

    def _process_report_with_mistral(self, text_report: str) -> CityReportEvent:
        """
        Calls Mistral Chat Completions API with structured output prompting.
        """
        system_prompt = f"""You are an AI Urban Flood Analyst for the Central Delhi Mandi House -> Rajiv Chowk corridor.
Extract structured flood event parameters from citizen reports.

Valid Landmarks:
{json.dumps(self.landmarks, indent=2)}

Output JSON format strictly matching this structure:
{{
  "location": "<one landmark from valid list>",
  "event": "<event category e.g. drain_blockage, construction, severe_waterlogging, pump_intervention>",
  "event_type": "<same as event>",
  "blockage_ratio": <float 0.0 to 1.0>,
  "road_capacity_reduction": <float 0.0 to 1.0>,
  "confidence": <float 0.5 to 1.0>
}}
Do NOT include markdown formatting or extra commentary. Return ONLY the raw JSON object."""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text_report}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }

        response = requests.post(self.api_url, headers=headers, json=payload, timeout=12)
        response.raise_for_status()
        
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        
        # Clean any potential backticks or markdown formatting if returned
        clean_content = re.sub(r"^```(json)?|```$", "", content.strip(), flags=re.MULTILINE).strip()
        parsed = json.loads(clean_content)

        # Ensure location matches known landmarks or defaults safely
        location = parsed.get("location", "Mandi House")
        if location not in self.landmarks:
            for lm in self.landmarks:
                if lm.lower() in location.lower() or location.lower() in lm.lower():
                    location = lm
                    break
            else:
                location = "Mandi House"

        event = parsed.get("event", "waterlogging_report")
        event_type = parsed.get("event_type", event)
        blockage_ratio = float(parsed.get("blockage_ratio", 0.0))
        road_reduction = float(parsed.get("road_capacity_reduction", 0.0))
        confidence = float(parsed.get("confidence", 0.95))

        return CityReportEvent(
            location=location,
            event=event,
            event_type=event_type,
            blockage_ratio=round(min(1.0, max(0.0, blockage_ratio)), 2),
            road_capacity_reduction=round(min(1.0, max(0.0, road_reduction)), 2),
            confidence=round(confidence, 2),
            source="mistral_ai_report",
            raw_text=text_report
        )

    def _process_report_rule_based(self, text_report: str) -> CityReportEvent:
        """
        Fallback heuristic rule-based NLP parser.
        """
        report_lower = text_report.lower()

        # Step 1: Identify Location
        detected_location = "Mandi House"  # Default fallback
        for lm in self.landmarks:
            parts = lm.lower().split()
            if any(part in report_lower for part in parts if len(part) > 3):
                detected_location = lm
                break
        
        if "rajiv" in report_lower or "cp" in report_lower or "connaught" in report_lower:
            detected_location = "Rajiv Chowk Outer Circle"
        elif "barakhamba" in report_lower:
            detected_location = "Barakhamba Rd Metro"
        elif "tolstoy" in report_lower:
            detected_location = "Tolstoy Marg Junction"
        elif "janpath" in report_lower:
            detected_location = "Janpath Junction"
        elif "kg" in report_lower or "kasturba" in report_lower:
            detected_location = "KG Marg Junction"

        # Step 2: Identify Event Type
        event_type = "waterlogging_report"
        blockage_ratio = 0.0
        road_reduction = 0.0

        if any(w in report_lower for w in ["clog", "block", "choke", "garbage", "trash", "plastic"]):
            event_type = "drain_blockage"
            blockage_ratio = 0.70
            road_reduction = 0.20
        elif any(w in report_lower for w in ["constrain", "construction", "work", "digging", "single lane", "closed"]):
            event_type = "construction"
            blockage_ratio = 0.30
            road_reduction = 0.50
        elif any(w in report_lower for w in ["overflow", "flood", "submerged", "deep water", "high water"]):
            event_type = "severe_waterlogging"
            blockage_ratio = 0.85
            road_reduction = 0.60
        elif any(w in report_lower for w in ["pump", "cleared", "drained"]):
            event_type = "pump_intervention"
            blockage_ratio = 0.0
            road_reduction = 0.0

        # Refine severity percentage if numbers are mentioned (e.g. "60% blocked" or "half closed")
        pct_match = re.search(r'(\d+)\s*%', report_lower)
        if pct_match:
            pct_val = float(pct_match.group(1)) / 100.0
            if "block" in report_lower or "clog" in report_lower:
                blockage_ratio = min(1.0, pct_val)
            else:
                road_reduction = min(1.0, pct_val)

        return CityReportEvent(
            location=detected_location,
            event=event_type,
            event_type=event_type,
            blockage_ratio=round(blockage_ratio, 2),
            road_capacity_reduction=round(road_reduction, 2),
            confidence=0.88,
            source="citizen_report",
            raw_text=text_report
        )
