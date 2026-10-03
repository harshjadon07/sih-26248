from datetime import datetime, timezone

def get_current_sim_time(exercise) -> int:
    """Calculate the current simulation time in milliseconds."""
    if exercise.status == "active" and exercise.last_resumed_at:
        now = datetime.now(timezone.utc)
        elapsed_ms = int((now - exercise.last_resumed_at.replace(tzinfo=timezone.utc)).total_seconds() * 1000)
        return exercise.accumulated_sim_time + elapsed_ms
    return exercise.accumulated_sim_time

def process_disruptions(event_payload: dict, configuration: dict, random_seed: int):
    """
    Applies delays, dropouts, or stale modifications based on configuration and seed.
    Returns (modified_payload, delay_ms, dropped)
    """
    import random
    import json
    
    rnd = random.Random(random_seed + hash(json.dumps(event_payload)))
    
    drop_rate = configuration.get("communication_disruptions", {}).get("dropout_rate", 0.0)
    delay_ms = configuration.get("communication_disruptions", {}).get("delay_ms", 0)
    
    if rnd.random() < drop_rate:
        return event_payload, delay_ms, True
        
    return event_payload, delay_ms, False
