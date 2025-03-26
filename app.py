from flask import Flask, request, jsonify, send_file, Response, send_from_directory
import ffmpeg
from flask_cors import CORS
import os
import re

app = Flask(__name__, static_folder='frontend/build/static')
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BUILD_DIR = os.path.join(BASE_DIR, 'frontend', 'build')
VIDEO_DIR = os.path.join(BASE_DIR, 'server', 'video')

os.makedirs(BUILD_DIR, exist_ok=True)
os.makedirs(VIDEO_DIR, exist_ok=True)

@app.route('/')
def serve_react_app():
    return send_from_directory(BUILD_DIR, 'index.html')

@app.route('/video/<filename>')
def stream_video(filename):
    video_path = os.path.join(VIDEO_DIR, filename)
    
    if not os.path.exists(video_path):
        print(video_path)
        return "Video not found", 404
    
    file_size = os.path.getsize(video_path)

    range_header = request.headers.get('Range', None)
    
    if range_header:
        byte1, byte2 = 0, None
        match = re.search(r'(\d+)-(\d*)', range_header)
        groups = match.groups()

        if groups[0]:
            byte1 = int(groups[0])
        if groups[1]:
            byte2 = int(groups[1])
        
        if byte2 is not None:
            length = byte2 + 1 - byte1
        else:
            length = file_size - byte1

        data = None
        with open(video_path, 'rb') as f:
            f.seek(byte1)
            data = f.read(length)

        rv = Response(data, 
                      206,
                      mimetype='video/mp4', 
                      content_type='video/mp4', 
                      direct_passthrough=True)
        rv.headers.add('Content-Range', f'bytes {byte1}-{byte1 + length - 1}/{file_size}')
        rv.headers.add('Accept-Ranges', 'bytes')
        return rv

    return send_file(
        video_path,
        mimetype='video/mp4',
        as_attachment=False
    )

@app.route('/api/request-subtitle', methods=['POST'])
def request_subtitle():
    data = request.get_json()
    video_id = data.get('videoId')
    video_name = ''.join(video_id.split('.')[0:-1])
    
    
    if not video_id:
        return jsonify({'error': 'videoId is required'}), 400
    
    video_path = os.path.join(VIDEO_DIR, video_id)
    print(video_path)

    if not os.path.exists(video_path):
        return jsonify({'error': 'Video file not found'}), 404
        
    subtitle_filename = f"{video_name}.vtt"
    subtitle_path = os.path.join(VIDEO_DIR, subtitle_filename)
    
    probe = ffmpeg.probe(video_path)
    subtitle_streams = [stream for stream in probe['streams'] if stream['codec_type'] == 'subtitle']
    
    stream_index = subtitle_streams[0]['index']
    
    (
        ffmpeg
        .input(video_path)
        .output(subtitle_path, map=f'0:{stream_index}', format='webvtt')
        .run(capture_stdout=True, capture_stderr=True, overwrite_output=True)
    )

    if os.path.exists(subtitle_path):
        return send_file(subtitle_path, mimetype="text/vtt")
    else:
        return jsonify({'error': 'Failed to send subtitle file'}), 500
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)
