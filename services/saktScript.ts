
export const getSaktPythonScript = (word: string, history: any[], now: string) => {
    // Properly escape the JSON string for Python injection
    const historyJson = JSON.stringify(history).replace(/"/g, '\\"');
    
    return `
import json
import math
from datetime import datetime

# --- INPUT DATA ---
word = "${word}"
history_json = "${historyJson}"
now_iso = "${now}"

try:
    history = json.loads(history_json)
except:
    history = []

# Handle timezone 'Z' manually if needed, or assume UTC
now = datetime.fromisoformat(now_iso.replace('Z', '+00:00'))

# --- SAKT MODEL SIMULATION (PYTHON) ---
# This script simulates the Self-Attentive Knowledge Tracing logic
# by calculating decay based on time (forgetting curve) and 
# interaction quality.

def calculate_mastery(history_data, current_time):
    if not history_data:
        return 0.1
    
    mastery = 0.5
    
    for interaction in history_data:
        # Parse timestamp, handling Z for UTC
        ts_str = interaction['timestamp'].replace('Z', '+00:00')
        timestamp = datetime.fromisoformat(ts_str)
        quality = interaction['quality']
        
        # Calculate time elapsed in days
        delta = current_time - timestamp
        days_ago = max(0, delta.total_seconds() / 86400)
        
        # SAKT Attention / Decay mechanism
        # Recent interactions have higher weight (0.95 decay factor)
        recency_weight = math.pow(0.95, days_ago)
        
        if quality >= 3:
            # Correct answer increases mastery
            increment = (0.1 + (quality - 3) * 0.05) * recency_weight
            mastery += increment
        else:
            # Incorrect answer decreases mastery
            decrement = (0.2 - quality * 0.05) * recency_weight
            mastery -= decrement
            
    return max(0.05, min(1.0, mastery))

def calculate_next_interval(mastery, repetition):
    if mastery < 0.4:
        return 1
    
    # Exponential spacing based on repetition and mastery
    base_interval = math.pow(repetition + 1, 2.2)
    mastery_multiplier = 1 + (mastery - 0.4) * 15
    
    interval = math.ceil(base_interval * mastery_multiplier)
    return min(interval, 365)

# --- EXECUTION ---

# Calculate Repetition count (consecutive successes)
repetition = 0
for interaction in history:
    if interaction['quality'] >= 3:
        repetition += 1
    else:
        repetition = 0

current_mastery = calculate_mastery(history, now)
next_interval = calculate_next_interval(current_mastery, repetition)

# --- OUTPUT ---
result = {
    "mastery": current_mastery,
    "interval": next_interval,
    "repetition": repetition
}

print(json.dumps(result))
`;
};
