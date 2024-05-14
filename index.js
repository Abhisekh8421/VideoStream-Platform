import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { error } from "console";
import { stderr, stdout } from "process";

const app = express();

//Multer

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + uuidv4() + path.extname(file.originalname));
  },
});

//Multer Configuration

const upload = multer({ storage: storage });

app.use(
  cors({
    origin: ["https://localhost:5173", "https://localhost:3000"],
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"), (req, res) => {
  const lessonId = uuidv4();
  const videoPath = req.file.path;
  const outputPath = `./uploads/videos/${lessonId}`;
  const hls = `${outputPath}/index.m3u8`;
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath}`;
  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.log(`exec error: ${error}`);
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
    const videoUrl = `http://localhost:8000/uploads/videos/${lessonId}/index.m3u8`;
    res.json({
      message: "Video converted to HLS format",
      videoUrl: videoUrl,
      lessonId: lessonId,
    });
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "hello everyone",
  });
});

app.post("/upload", upload.single("file"));

app.listen(8000, () => {
  console.log("Server Started");
});
