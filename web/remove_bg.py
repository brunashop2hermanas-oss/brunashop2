import sys
from PIL import Image

def remove_white_background(input_path, output_path):
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        datas = img.getdata()
        newData = []
        
        # Tolerancia para considerar "blanco" (240 a 255)
        for item in datas:
            # item es (R, G, B, A)
            if item[0] > 230 and item[1] > 230 and item[2] > 230:
                newData.append((255, 255, 255, 0)) # Transparente
            else:
                newData.append(item)
                
        img.putdata(newData)
        img.save(output_path, "PNG")
        print("Fondo removido exitosamente.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    remove_white_background(sys.argv[1], sys.argv[2])
