import subprocess, tempfile, os, uuid, asyncio
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

ISOLATE_PATH = "/usr/bin/isolate"
BOX_ID = 0

class TestCase(BaseModel):
    id: str
    input: str
    expectedOutput: str

class ExecuteRequest(BaseModel):
    code: str
    testcases: list[TestCase]
    timeLimit: float = 2.0
    memoryLimit: int = 256

def parse_meta(meta_path: str):
    meta = {}
    try:
        with open(meta_path) as f:
            for line in f:
                k, _, v = line.strip().partition(":")
                meta[k.strip()] = v.strip()
    except:
        pass
    
    time_ms = int(float(meta.get("time", "0")) * 1000)
    memory_kb = int(meta.get("max-rss", "0"))
    exit_code = int(meta.get("exitcode", "0"))
    return time_ms, memory_kb, exit_code

@router.post("")
async def execute(req: ExecuteRequest):
    # 1. Init isolate box
    subprocess.run([ISOLATE_PATH, "--box-id", str(BOX_ID), "--init"], check=True)
    box_dir = f"/var/lib/isolate/{BOX_ID}/box"

    # 2. Write code to temp file inside box
    src_path = os.path.join(box_dir, "main.cpp")
    with open(src_path, "w") as f:
        f.write(req.code)

    # 3. Compile with g++
    compile_result = subprocess.run(
        ["g++", "-O2", "-o", os.path.join(box_dir, "solution"), src_path],
        capture_output=True, text=True, timeout=30
    )
    if compile_result.returncode != 0:
        subprocess.run([ISOLATE_PATH, "--box-id", str(BOX_ID), "--cleanup"])
        return { "compilationError": compile_result.stderr, "results": [] }

    # 4. Run each test case
    results = []
    for tc in req.testcases:
        meta_file = f"/tmp/meta_{uuid.uuid4().hex}"
        run_result = subprocess.run(
            [
                ISOLATE_PATH,
                "--box-id", str(BOX_ID),
                "--time", str(req.timeLimit),
                "--mem", str(req.memoryLimit * 1024),
                "--meta", meta_file,
                "--run", "--", "/box/solution"
            ],
            input=tc.input,
            capture_output=True,
            text=True,
        )
        
        stdout = run_result.stdout
        stderr = run_result.stderr
        
        # Parse meta file for time and memory
        time_ms, memory_kb, exit_code = parse_meta(meta_file)
        
        # Determine status
        expected = tc.expectedOutput.strip()
        actual = stdout.strip()
        
        if run_result.returncode == 0 and actual == expected:
            status = "AC"
        elif "time" in stderr.lower() or time_ms >= req.timeLimit * 1000:
            status = "TLE"
        elif "memory" in stderr.lower():
            status = "MLE"
        elif run_result.returncode != 0:
            status = "RE"
        else:
            status = "WA"
        
        results.append({
            "id": tc.id,
            "status": status,
            "stdout": stdout,
            "stderr": stderr,
            "timeMs": time_ms,
            "memoryKb": memory_kb,
            "exitCode": run_result.returncode,
        })
        
        try:
            os.remove(meta_file)
        except:
            pass

    # 5. Cleanup
    subprocess.run([ISOLATE_PATH, "--box-id", str(BOX_ID), "--cleanup"])

    return {"compilationError": None, "results": results}
