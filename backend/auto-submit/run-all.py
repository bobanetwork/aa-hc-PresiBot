import subprocess
import time
import sys

def run():
    # 1. End current game
    print("\n=== Ending Current Game... ===")
    if not run_with_retry("auto-end-game.py"):
        sys.exit(1)
    time.sleep(15)  # Wait between transactions

    # 2. Start new game
    print("\n=== Restarting New Game... ===")
    if not run_with_retry("auto-start-new-game.py"):
        sys.exit(1)
    time.sleep(15)  # Wait between transactions

    # 3. Submit answers
    print("\n=== Auto Submitting Answers... ===")
    if not run_with_retry("auto-submit-answers.py"):
        sys.exit(1)

def run_with_retry(script_name, max_retries=3):
    """Run a script with retries if it fails"""
    for attempt in range(max_retries):
        print(f"\nAttempt {attempt + 1}/{max_retries} for {script_name}")

        if subprocess.run(["python", script_name]).returncode == 0:
            print(f"✓ {script_name} completed successfully")
            return True

        print(f"! Attempt {attempt + 1} failed for {script_name}")
        if attempt < max_retries - 1:
            print(f"Waiting 30 seconds before retry...")
            time.sleep(30)

    print(f"X All {max_retries} attempts failed for {script_name}")
    return False

if __name__ == "__main__":
    run()