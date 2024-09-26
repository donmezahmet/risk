const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path'); // HTML dosyalarını göndermek için

// MongoDB bağlantısı
mongoose.connect('mongodb+srv://ahmetdonmez:Vista20204@cluster0.vnnvz.mongodb.net/task_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB bağlantısı başarılı!'))
.catch((err) => console.error('MongoDB bağlantısı başarısız:', err));

// Express uygulaması oluştur
const app = express();
app.use(cors());
app.use(express.json()); // JSON veri gönderip almak için

// Görev modeli (Schema ve Model tanımı)
const TaskSchema = new mongoose.Schema({
    department: String,
    process: String,
    processType: String,
    stakeholders: String,
    startDate: String,
    dueDate: String,
    projectFolder: String,
    status: String
});

const Task = mongoose.model('Task', TaskSchema);

// Ana sayfa isteği için index.html gönder
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // index.html dosyasını gönder
});

// Görevleri MongoDB'den getir
app.get('/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Görevleri alırken hata oluştu.' });
    }
});

// Yeni görev oluştur
app.post('/tasks', async (req, res) => {
    const newTask = new Task(req.body);
    try {
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(400).json({ error: 'Görev oluşturulamadı.' });
    }
});

// Görev güncelle
app.put('/tasks/:id', async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ error: 'Görev güncellenemedi.' });
    }
});

// Sunucuyu başlat
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor.`));
