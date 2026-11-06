import subprocess
result = subprocess.run(['echo', 'test'], capture_output=True, text=True)
print(result.stdout)
print(result.stderr)
