from PIL import Image, ImageDraw

def process_logo(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    
    width, height = img.size
    print(f"Original size: {width}x{height}")
    
    # We will create a circular mask based on the center.
    # The logo is inside a white circle. We will make everything outside the main circle transparent.
    # Let's assume the circle takes up the whole image height/width.
    # Actually, we can just find the bounding box of non-black pixels.
    # Or just flood fill the corners.
    
    # A safer approach to remove the black corners: 
    # Create a new transparent image
    transparent_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    
    # The circle radius is roughly min(width, height) / 2
    r = min(width, height) / 2
    cx, cy = width / 2, height / 2
    
    # Create a mask
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    
    # Paste using mask
    transparent_img.paste(img, (0, 0), mask)
    
    # Resize to icon size
    icon_size = (256, 256)
    icon = transparent_img.resize(icon_size, Image.Resampling.LANCZOS)
    
    # Save as ICO
    icon.save(output_path, format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (32, 32)])
    print(f"Saved icon to {output_path}")

try:
    process_logo(r"C:\Users\abrah\.gemini\antigravity-ide\brain\208f5ba1-2f0b-4f9f-ad43-512e12627b9f\media__1781907007440.png", r"C:\Users\abrah\Desktop\sistema_BrunaShop2\src\app\favicon.ico")
except Exception as e:
    print(f"Error with 1st image: {e}")
    try:
        process_logo(r"C:\Users\abrah\.gemini\antigravity-ide\brain\208f5ba1-2f0b-4f9f-ad43-512e12627b9f\media__1781907501976.png", r"C:\Users\abrah\Desktop\sistema_BrunaShop2\src\app\favicon.ico")
    except Exception as e2:
        print(f"Error with 2nd image: {e2}")
