import express from 'express';

const app = express();
app.use(express.json());

const submissions = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: 'mock-judge0-v1.0' });
});

app.get('/languages', (req, res) => {
  res.json([
    { id: 54, name: 'C++ (GCC 9.2.0)' },
    { id: 62, name: 'Java (OpenJDK 13.0.1)' },
    { id: 71, name: 'Python (3.8.1)' },
    { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
  ]);
});

app.post('/submissions', (req, res) => {
  const token = `mock-token-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const { source_code, language_id, stdin, expected_output } = req.body;

  // Determine mock output
  let stdout = expected_output || (stdin ? `Processed: ${stdin}` : 'Hello from Judge0 Stub!\n');
  let status = { id: 3, description: 'Accepted' };

  if (source_code && source_code.includes('THROW_RUNTIME_ERROR')) {
    status = { id: 11, description: 'Runtime Error (NZEC)' };
    stdout = null;
  } else if (source_code && source_code.includes('TRIGGER_TLE')) {
    status = { id: 5, description: 'Time Limit Exceeded' };
    stdout = null;
  } else if (source_code && source_code.includes('TRIGGER_COMPILE_ERROR')) {
    status = { id: 6, description: 'Compilation Error' };
    stdout = null;
  }

  const result = {
    token,
    stdout,
    time: '0.042',
    memory: 1420,
    stderr: null,
    compile_output: status.id === 6 ? 'mock_main.cpp: In function int main(): syntax error' : null,
    message: null,
    status,
  };

  submissions.set(token, result);

  const wait = req.query.wait === 'true';
  if (wait) {
    return res.status(201).json(result);
  }

  res.status(201).json({ token });
});

app.get('/submissions/:token', (req, res) => {
  const { token } = req.params;
  const result = submissions.get(token);
  if (!result) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  res.json(result);
});

const PORT = process.env.PORT || 2358;
app.listen(PORT, () => {
  console.log(`[Judge0 Stub] Running on port ${PORT}`);
});
