Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("src\assets\laptop.png")
$bmp = New-Object System.Drawing.Bitmap($img)
$pixel = $bmp.GetPixel(0,0)
$hex = '#{0:X2}{1:X2}{2:X2}' -f $pixel.R, $pixel.G, $pixel.B
Write-Host "THE BACKGROUND COLOR IS: $hex"
