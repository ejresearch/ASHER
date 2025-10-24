from PIL import Image, ImageDraw, ImageFont

# Create 192x192 icon
img192 = Image.new('RGB', (192, 192), color='#007aff')
draw = ImageDraw.Draw(img192)
try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60)
except:
    font = ImageFont.load_default()
draw.text((96, 96), "ASHER", fill='white', anchor='mm', font=font)
img192.save('icon-192.png')

# Create 512x512 icon
img512 = Image.new('RGB', (512, 512), color='#007aff')
draw = ImageDraw.Draw(img512)
try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 160)
except:
    font = ImageFont.load_default()
draw.text((256, 256), "ASHER", fill='white', anchor='mm', font=font)
img512.save('icon-512.png')

print("Icons created successfully!")
