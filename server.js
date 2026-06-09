const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity in local dev
        methods: ["GET", "POST"]
    }
});

const PORT = 3001;

// Initialize SQLite Database
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        db.serialize(() => {
            db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, user_id TEXT UNIQUE, password TEXT)");
            // 기존 단일 date 스키마에서 start_date/end_date 범위 스키마로 마이그레이션
            db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='schedules'", [], (err, row) => {
                if (row && row.sql && row.sql.includes('start_date')) {
                    // 이미 새 스키마
                } else {
                    db.run("DROP TABLE IF EXISTS schedules");
                    db.run(`CREATE TABLE IF NOT EXISTS schedules (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT NOT NULL,
                        start_date TEXT NOT NULL,
                        end_date TEXT NOT NULL,
                        environment TEXT NOT NULL DEFAULT 'alpha',
                        description TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )`);
                }
            });
        });
    }
});

// User Registration API
app.post('/api/signup', (req, res) => {
    const { name, user_id, password } = req.body;

    if (!name || !user_id || !password) {
        return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    db.get("SELECT * FROM users WHERE user_id = ?", [user_id], (err, row) => {
        if (err) {
            console.error('DB Error:', err);
            return res.status(500).json({ error: '서버 에러가 발생했습니다.' });
        }

        if (row) {
            return res.status(409).json({ error: '중복된 아이디입니다' });
        } else {
            db.run("INSERT INTO users (name, user_id, password) VALUES (?, ?, ?)", [name, user_id, password], function (err) {
                if (err) {
                    console.error('Insert Error:', err);
                    return res.status(500).json({ error: '회원가입 중 에러가 발생했습니다.' });
                }
                res.status(201).json({ message: '회원가입이 완료되었습니다.' });
            });
        }
    });
});

// User Login API
app.post('/api/login', (req, res) => {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
        return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해주세요.' });
    }

    db.get("SELECT * FROM users WHERE user_id = ? AND password = ?", [user_id, password], (err, row) => {
        if (err) {
            console.error('Login DB Error:', err);
            return res.status(500).json({ error: '서버 에러가 발생했습니다.' });
        }

        if (row) {
            return res.status(200).json({ message: '로그인 성공', user: { name: row.name, user_id: row.user_id } });
        } else {
            return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
        }
    });
});

// Get All Users API (For Postman)
app.get('/api/users', (req, res) => {
    const { name } = req.query;

    if (name) {
        // 이름이 포함된 회원 검색 (부분 일치)
        db.all("SELECT id, name, user_id, password FROM users WHERE name LIKE ?", [`%${name}%`], (err, rows) => {
            if (err) {
                console.error('Error fetching users:', err);
                return res.status(500).json({ error: '데이터베이스 조회 중 에러가 발생했습니다.' });
            }
            res.json(rows);
        });
    } else {
        // 쿼리 파라미터가 없으면 전체 회원 조회
        db.all("SELECT id, name, user_id, password FROM users", [], (err, rows) => {
            if (err) {
                console.error('Error fetching users:', err);
                return res.status(500).json({ error: '데이터베이스 조회 중 에러가 발생했습니다.' });
            }
            res.json(rows);
        });
    }
});

// Get Specific User API (For Postman)
app.get('/api/users/:id', (req, res) => {
    const { id } = req.params;

    db.get("SELECT id, name, user_id, password FROM users WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ error: '데이터베이스 조회 중 에러가 발생했습니다.' });
        }

        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: '해당 회원을 찾을 수 없습니다.' });
        }
    });
});

// Update User API (For Postman)
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, user_id, password } = req.body;

    // 변경할 필드가 하나도 없는 경우
    if (!name && !user_id && !password) {
        return res.status(400).json({ error: '수정할 항목을 최소 하나 이상 입력해주세요 (name, user_id, password 중).' });
    }

    // 동적으로 SQL 쿼리 생성 (부분 수정 지원)
    const updates = [];
    const params = [];

    if (name) {
        updates.push("name = ?");
        params.push(name);
    }
    if (user_id) {
        updates.push("user_id = ?");
        params.push(user_id);
    }
    if (password) {
        updates.push("password = ?");
        params.push(password);
    }

    // 마지막으로 WHERE id = ? 조건을 위한 파라미터 추가
    params.push(id);

    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Error updating user:', err);
            // 아이디 중복 에러 처리
            if (err.message.includes('UNIQUE constraint failed')) {
               return res.status(409).json({ error: '이미 사용 중인 아이디입니다.' });
            }
            return res.status(500).json({ error: '회원 정보 수정 중 에러가 발생했습니다.' });
        }

        if (this.changes > 0) {
            res.json({ message: '회원 정보가 성공적으로 수정되었습니다.' });
        } else {
            res.status(404).json({ error: '해당 회원을 찾을 수 없습니다.' });
        }
    });
});

// Delete User API (For Postman)
app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;

    db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ error: '회원 삭제 중 에러가 발생했습니다.' });
        }

        if (this.changes > 0) {
            res.json({ message: '회원이 성공적으로 삭제되었습니다.' });
        } else {
            res.status(404).json({ error: '해당 회원을 찾을 수 없습니다.' });
        }
    });
});

// API to list test files
app.get('/api/tests', (req, res) => {
    const testsDir = path.join(__dirname, 'tests');

    if (!fs.existsSync(testsDir)) {
        return res.status(404).json({ error: 'Tests directory not found' });
    }

    fs.readdir(testsDir, (err, files) => {
        if (err) {
            console.error('Error reading tests directory:', err);
            return res.status(500).json({ error: 'Unable to read tests directory' });
        }

        // Filter for .spec.ts or .test.ts files
        const testFiles = files.filter(file => file.endsWith('.spec.ts') || file.endsWith('.test.ts'));
        res.json(testFiles);
    });
});

// Get auth.json last modified time (for 24h lockout)
app.get('/api/auth-status', (req, res) => {
    const authPath = path.join(__dirname, 'auth.json');
    try {
        if (fs.existsSync(authPath)) {
            const stats = fs.statSync(authPath);
            res.json({ lastModified: stats.mtimeMs });
        } else {
            res.json({ lastModified: null });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================
// Schedule Management API (QA 일정 관리)
// Fields: title, start_date, end_date, environment (alpha|beta), description
// ============================================================

// Get All Schedules
app.get('/api/schedules', (req, res) => {
    db.all("SELECT * FROM schedules ORDER BY start_date ASC", [], (err, rows) => {
        if (err) {
            console.error('Error fetching schedules:', err);
            return res.status(500).json({ error: '일정을 가져오는 중 에러가 발생했습니다.' });
        }
        res.json(rows);
    });
});

// Add a Schedule
app.post('/api/schedules', (req, res) => {
    const { title, start_date, end_date, environment, description } = req.body;
    if (!title || !start_date || !end_date) {
        return res.status(400).json({ error: '제목, 시작일, 종료일은 필수 입력 항목입니다.' });
    }
    db.run("INSERT INTO schedules (title, start_date, end_date, environment, description) VALUES (?, ?, ?, ?, ?)",
        [title, start_date, end_date, environment || 'alpha', description || null],
        function (err) {
            if (err) {
                console.error('Error inserting schedule:', err);
                return res.status(500).json({ error: '일정을 추가하는 중 에러가 발생했습니다.' });
            }
            res.status(201).json({ id: this.lastID, message: '일정이 추가되었습니다.' });
        }
    );
});

// Update a Schedule
app.put('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    const { title, start_date, end_date, environment, description } = req.body;
    if (!title || !start_date || !end_date) {
        return res.status(400).json({ error: '제목, 시작일, 종료일은 필수 입력 항목입니다.' });
    }
    db.run("UPDATE schedules SET title = ?, start_date = ?, end_date = ?, environment = ?, description = ? WHERE id = ?",
        [title, start_date, end_date, environment || 'alpha', description || null, id],
        function (err) {
            if (err) {
                console.error('Error updating schedule:', err);
                return res.status(500).json({ error: '일정을 수정하는 중 에러가 발생했습니다.' });
            }
            if (this.changes > 0) {
                res.json({ message: '일정이 수정되었습니다.' });
            } else {
                res.status(404).json({ error: '해당 일정을 찾을 수 없습니다.' });
            }
        }
    );
});

// Delete a Schedule
app.delete('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM schedules WHERE id = ?", [id], function (err) {
        if (err) {
            console.error('Error deleting schedule:', err);
            return res.status(500).json({ error: '일정을 삭제하는 중 에러가 발생했습니다.' });
        }
        if (this.changes > 0) {
            res.json({ message: '일정이 삭제되었습니다.' });
        } else {
            res.status(404).json({ error: '해당 일정을 찾을 수 없습니다.' });
        }
    });
});


// ============================================================
// Image Upload API (for Playwright automation)
// ============================================================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// POST /api/image - 이미지 업로드
// Postman: Body → binary → 파일 선택
// Header: Content-Type: image/png (또는 image/jpeg)
// Query: ?filename=product.png (선택사항, 없으면 uploaded_image.png)
app.post('/api/image', express.raw({ type: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'], limit: '10mb' }), (req, res) => {
    if (!req.body || req.body.length === 0) {
        return res.status(400).json({ error: '이미지 데이터가 없습니다. Postman에서 Body → binary로 파일을 선택해주세요.' });
    }

    // 파일명 결정 (쿼리 파라미터 또는 기본값)
    const filename = req.query.filename || 'uploaded_image.png';
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, req.body);
    console.log(`✅ 이미지 저장 완료: ${filePath} (${req.body.length} bytes)`);

    res.status(201).json({
        message: '이미지 업로드 성공',
        filename: filename,
        size: req.body.length,
        url: `/api/image/${filename}`
    });
});

// GET /api/image - 저장된 이미지 목록 조회
app.get('/api/image', (req, res) => {
    if (!fs.existsSync(uploadsDir)) {
        return res.json({ images: [] });
    }

    const files = fs.readdirSync(uploadsDir).filter(f =>
        /\.(png|jpg|jpeg|webp)$/i.test(f)
    );

    const images = files.map(f => {
        const stats = fs.statSync(path.join(uploadsDir, f));
        return {
            filename: f,
            size: stats.size,
            uploadedAt: stats.mtimeMs,
            url: `/api/image/${f}`
        };
    });

    res.json({ images });
});

// GET /api/image/:filename - 특정 이미지 파일 다운로드 (Playwright에서 사용)
app.get('/api/image/:filename', (req, res) => {
    const filePath = path.join(uploadsDir, req.params.filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: '해당 이미지를 찾을 수 없습니다.' });
    }

    res.sendFile(filePath);
});

// DELETE /api/image/:filename - 특정 이미지 삭제
app.delete('/api/image/:filename', (req, res) => {
    const filePath = path.join(uploadsDir, req.params.filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: '해당 이미지를 찾을 수 없습니다.' });
    }

    fs.unlinkSync(filePath);
    console.log(`🗑️ 이미지 삭제 완료: ${filePath}`);
    res.json({ message: '이미지가 삭제되었습니다.', filename: req.params.filename });
});

// Serve test results (videos, screenshots)
const testResultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
}
const serveIndex = require('serve-index');
app.use('/test-results', express.static(testResultsDir), serveIndex(testResultsDir, { 'icons': true }));

// Serve static files from the React app (dashboard/dist)
// This enables the app to be served directly from backend in production
const dashboardDist = path.join(__dirname, 'dashboard', 'dist');
if (fs.existsSync(dashboardDist)) {
    app.use(express.static(dashboardDist));

    // The "catchall" handler: for any request that doesn't
    // match one above, send back React's index.html file.
    // Fixed for Express 5: Use regex /.*/ instead of string '*'
    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(dashboardDist, 'index.html'));
    });
}

let activeProcess = null;

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('run-test', (filename, credentials) => {
        if (activeProcess) {
            socket.emit('test-output', 'A test is already running. Please wait.\n');
            return;
        }

        console.log(`Running test: ${filename}`);
        socket.emit('test-start', filename);

        // Construct command: npx playwright test "<absolute_path>"
        // Using absolute path is safer to avoid relative path resolution issues
        const testPath = path.join(__dirname, 'tests', filename);
        const command = 'npx';
        // We quote the path in case of spaces, though spawn with args array usually handles it.
        // On Windows with shell:true, quoting might be needed if paths have spaces.
        // However, passing arguments as array to spawn with shell:true might behave differently.
        // Let's explicitly construct the command string for shell execution to be 100% sure.

        const fullCommand = `npx playwright test "${testPath.replace(/\\/g, '\\\\')}" --project=chromium`;
        console.log(`Executing: ${fullCommand}`);

        // 환경변수 설정: generate_auth.spec.ts 실행 시 자격 증명 전달
        const env = { ...process.env };
        if (credentials && credentials.id && credentials.pw) {
            env.KAKAO_ID = credentials.id;
            env.KAKAO_PW = credentials.pw;
            console.log(`Using custom credentials for: ${credentials.id}`);
        }

        // Spawn process using the full command string for better control
        // detached: true → 프로세스 그룹 생성 (Stop 시 자식 프로세스까지 한번에 종료)
        activeProcess = spawn(fullCommand, {
            cwd: __dirname,
            shell: true,
            detached: true,
            env: env
        });

        activeProcess.stdout.on('data', (data) => {
            socket.emit('test-output', data.toString());
        });

        activeProcess.stderr.on('data', (data) => {
            // Playwright often outputs logs to stderr
            socket.emit('test-output', data.toString());
        });

        activeProcess.on('close', (code) => {
            console.log(`Test finished with code ${code}`);

            // 비디오 파일 찾기 로직 제거 (실시간 스트리밍으로 대체)
            // 테스트 종료만 알림
            activeProcess = null;
            io.emit('test-complete', { code, video: null }); // video: null 전송
        });

        activeProcess.on('error', (err) => {
            console.error('Failed to start subprocess.', err);
            socket.emit('test-output', `Error: ${err.message}\n`);
            activeProcess = null;
        });
    });

    // [New] Real-time Streaming Relay
    // 테스트 스크립트(Client)가 보내는 화면 데이터를 받아서 대시보드(All Clients)로 브로드캐스트
    socket.on('stream-data', (data) => {
        // 자신(테스트 스크립트)을 제외하고, 대시보드에게만 전송하면 됨
        // 하지만 socket.broadcast가 편함
        socket.broadcast.emit('stream-frame', data);
    });

    // [New] Dashboard Input Relay (For Captcha)
    socket.on('send-input', (text) => {
        console.log(`Relaying user input: ${text}`);
        socket.broadcast.emit('user-input', text);
    });

    // [New] Dashboard Click Relay (For Image Click)
    socket.on('send-click', (data) => {
        console.log(`Relaying user click: ${JSON.stringify(data)}`);
        socket.broadcast.emit('user-click', data);
    });

    socket.on('stop-test', () => {
        if (activeProcess) {
            console.log('Stopping test process:', activeProcess.pid);

            if (process.platform === 'win32') {
                // Windows: Use taskkill to kill the process tree
                // /T = terminate child processes (tree)
                // /F = force terminate
                require('child_process').exec(`taskkill /pid ${activeProcess.pid} /T /F`, (err) => {
                    if (err) {
                        console.error('Failed to kill process tree:', err);
                        // Fallback to standard kill if taskkill fails
                        activeProcess.kill();
                    }
                });
            } else {
                // Unix/Linux/Mac: 프로세스 그룹 전체 종료 (-pid = 그룹 전체)
                // npx → playwright → chromium 모든 자식 프로세스를 한번에 죽입니다.
                try {
                    process.kill(-activeProcess.pid, 'SIGTERM');
                } catch (err) {
                    console.error('Failed to kill process group:', err);
                    // Fallback: 개별 프로세스만 종료
                    try { activeProcess.kill('SIGKILL'); } catch (e) { }
                }
            }

            socket.emit('test-output', '\n--- Process Terminated by User ---\n');
            socket.emit('test-complete', { code: -1, video: null });
            activeProcess = null;
        }
    });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'dashboard', 'dist')));
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, 'dashboard', 'dist', 'index.html'));
    } else {
        next();
    }
});

server.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
});
