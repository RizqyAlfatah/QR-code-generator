from flask import Flask, render_template, request, jsonify, send_file
import qrcode
from PIL import Image, ImageDraw, ImageFont, ImageOps
import io
import base64

app = Flask(__name__, template_folder='webserver', static_folder='webserver/static')

def create_final_qr(data, data_color, bg_color, eye_color, shape, logo_storage, 
                    frame_style, frame_text, frame_color, text_color, 
                    target_resolution=None): # Parameter baru: target_resolution
    
    # 1. Tentukan Box Size (Ukuran per titik)
    # Jika target_resolution diisi (misal 1300px), kita hitung box_size nya
    if target_resolution:
        # Bikin QR dummy dulu untuk hitung jumlah kotak (matrix)
        qr_temp = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, border=2)
        qr_temp.add_data(data)
        qr_temp.make(fit=True)
        matrix_len = len(qr_temp.get_matrix())
        
        # Rumus: Target / (Jumlah Kotak + Margin Frame)
        # Kita estimasi margin frame sekitar 10 box
        box_size = int(target_resolution / (matrix_len + 8))
        if box_size < 10: box_size = 10 # Minimal size
    else:
        # Default untuk preview
        box_size = 10

    # 2. Generate Matrix QR Asli dengan box_size yang sudah dihitung
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_size, # Pakai ukuran dinamis
        border=2, 
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    matrix = qr.get_matrix()
    qr_size = len(matrix) * box_size
    width = len(matrix)
    
    # Canvas Dasar
    img_qr = Image.new("RGB", (qr_size, qr_size), bg_color)
    draw_qr = ImageDraw.Draw(img_qr)
    
    # 3. Logika Menggambar (Sama seperti sebelumnya)
    for y in range(width):
        for x in range(width):
            if matrix[y][x]:
                is_eye = (x < 7 and y < 7) or \
                         (x > width - 8 and y < 7) or \
                         (x < 7 and y > width - 8)
                
                fill_color = eye_color if is_eye else data_color
                rect = [x * box_size, y * box_size, (x + 1) * box_size, (y + 1) * box_size]
                
                # Handling Shape
                if shape == 'circle':
                    padding = box_size * 0.1
                    draw_qr.ellipse([rect[0]+padding, rect[1]+padding, rect[2]-padding, rect[3]-padding], fill=fill_color)
                elif shape == 'rounded':
                    draw_qr.rounded_rectangle(rect, radius=box_size*0.4, fill=fill_color)
                elif shape == 'vertical':
                    padding = box_size * 0.2
                    draw_qr.rectangle([rect[0]+padding, rect[1], rect[2]-padding, rect[3]], fill=fill_color)
                elif shape == 'horizontal':
                    padding = box_size * 0.2
                    draw_qr.rectangle([rect[0], rect[1]+padding, rect[2], rect[3]-padding], fill=fill_color)
                elif shape == 'circuit':
                    if is_eye:
                        draw_qr.rounded_rectangle(rect, radius=box_size*0.2, fill=fill_color)
                    else:
                        padding = box_size * 0.1
                        draw_qr.ellipse([rect[0]+padding, rect[1]+padding, rect[2]-padding, rect[3]-padding], fill=fill_color)
                        # Logic Koneksi (Scaling coordinate manual)
                        mid = box_size // 2
                        if x < width - 1 and matrix[y][x+1]:
                            if not (((x+1)<7 and y<7) or ((x+1)>width-8 and y<7) or ((x+1)<7 and y>width-8)):
                                draw_qr.rectangle([rect[0]+mid, rect[1]+padding, rect[2]+mid, rect[3]-padding], fill=fill_color)
                        if y < width - 1 and matrix[y+1][x]:
                            if not ((x<7 and (y+1)<7) or (x>width-8 and (y+1)<7) or (x<7 and (y+1)>width-8)):
                                draw_qr.rectangle([rect[0]+padding, rect[1]+mid, rect[2]-padding, rect[3]+mid], fill=fill_color)
                else:
                    draw_qr.rectangle(rect, fill=fill_color)

    # 4. Logo (Auto Resize proporsional)
    if logo_storage:
        try:
            if isinstance(logo_storage, str): # Handle path string vs file object
                logo = Image.open(logo_storage)
            else:
                logo = Image.open(logo_storage)
                
            logo_max_size = int(qr_size * 0.22)
            logo.thumbnail((logo_max_size, logo_max_size), Image.Resampling.LANCZOS)
            pos = ((qr_size - logo.size[0]) // 2, (qr_size - logo.size[1]) // 2)
            if logo.mode != 'RGBA': logo = logo.convert('RGBA')
            img_qr = img_qr.convert('RGBA')
            img_qr.paste(logo, pos, logo)
            img_qr = img_qr.convert('RGB')
        except: pass

    # 5. Frame & Text Scaling
    if frame_style == 'none' or not frame_text:
        border_px = int(box_size * 2)
        final_img = ImageOps.expand(img_qr, border=border_px, fill=bg_color)
    else:
        # Scale Font Size berdasarkan box_size
        # Jika box_size 10 -> font 40. Jika box_size 50 -> font 200
        font_size = int(box_size * 4) 
        try: font = ImageFont.truetype("arial.ttf", font_size)
        except: font = ImageFont.load_default()
        
        left, top, right, bottom = font.getbbox(frame_text)
        text_w, text_h = right - left, bottom - top
        
        padding = int(box_size * 3)
        margin = int(box_size * 1)
        radius = int(box_size * 1.5)
        
        new_width = qr_size + (padding * 2)
        header_height = text_h + (padding * 2)
        
        # Helper function untuk posisi X tengah
        center_x = (new_width - text_w) / 2
        
        if frame_style == 'text_top':
            new_height = qr_size + header_height
            final_img = Image.new("RGB", (new_width, new_height), bg_color)
            final_img.paste(img_qr, (padding, header_height))
            draw = ImageDraw.Draw(final_img)
            draw.text((center_x, padding), frame_text, font=font, fill=text_color)
            
        elif frame_style == 'text_bottom':
            new_height = qr_size + header_height
            final_img = Image.new("RGB", (new_width, new_height), bg_color)
            final_img.paste(img_qr, (padding, margin))
            draw = ImageDraw.Draw(final_img)
            draw.text((center_x, qr_size + (padding*1.5)), frame_text, font=font, fill=text_color)
            
        elif frame_style == 'box_top':
            new_height = qr_size + header_height + margin
            final_img = Image.new("RGB", (new_width, new_height), bg_color)
            final_img.paste(img_qr, (padding, header_height + margin))
            draw = ImageDraw.Draw(final_img)
            draw.rounded_rectangle([margin, margin, new_width-margin, header_height], radius=radius, fill=frame_color)
            # Center text in box
            text_y = margin + (header_height - margin - text_h) / 2
            draw.text((center_x, text_y - (text_h*0.2)), frame_text, font=font, fill=text_color)
            
        elif frame_style == 'box_bottom':
            new_height = qr_size + header_height + margin
            final_img = Image.new("RGB", (new_width, new_height), bg_color)
            final_img.paste(img_qr, (padding, margin))
            draw = ImageDraw.Draw(final_img)
            draw.rounded_rectangle([margin, qr_size + (margin*2), new_width-margin, new_height-margin], radius=radius, fill=frame_color)
            text_y = qr_size + (margin*2) + (header_height - margin - text_h) / 2
            draw.text((center_x, text_y - (text_h*0.2)), frame_text, font=font, fill=text_color)
        else:
            final_img = img_qr

    return final_img

# --- Routes ---

@app.route('/')
def index(): return render_template('index.html')

@app.route('/generate_preview', methods=['POST'])
def generate_preview():
    # Ambil data (Preview Mode)
    # Gunakan img_io base64 seperti biasa untuk preview cepat
    try:
        img = process_request(request, high_res=False)
        img_io = io.BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        return jsonify({'image': base64.b64encode(img_io.getvalue()).decode()})
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)})

@app.route('/download', methods=['POST'])
def download():
    # Ambil data (Download Mode - High Res 1300px)
    try:
        img = process_request(request, high_res=True)
        img_io = io.BytesIO()
        img.save(img_io, 'PNG', quality=100)
        img_io.seek(0)
        return send_file(img_io, mimetype='image/png', as_attachment=True, download_name='custom_qr_hd.png')
    except Exception as e:
        print(e)
        return str(e)

def process_request(req, high_res=False):
    data = req.form.get('data', '')
    data_color = req.form.get('data_color', '#000000')
    bg_color = req.form.get('bg_color', '#ffffff')
    eye_color = req.form.get('eye_color', '#000000')
    shape = req.form.get('shape', 'square')
    frame_style = req.form.get('frame_style', 'none')
    frame_text = req.form.get('frame_text', 'SCAN ME')
    frame_color = req.form.get('frame_color', '#000000')
    text_color = req.form.get('text_color', '#ffffff')
    logo = req.files.get('logo')

    target_res = 1300 if high_res else None # SETTING RESOLUSI DI SINI
    
    return create_final_qr(data, data_color, bg_color, eye_color, shape, logo,
                           frame_style, frame_text, frame_color, text_color, 
                           target_resolution=target_res)

#local
#if __name__ == '__main__':
 #   app.run(debug=True)

#local network
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)