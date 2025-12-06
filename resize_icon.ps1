Add-Type -AssemblyName System.Drawing

$sourcePath = "$PWD\app\icon.png"
$tempPath = "$PWD\app\icon_temp.png"
$width = 256
$height = 256

if (-not (Test-Path $sourcePath)) {
    Write-Error "File not found: $sourcePath"
    exit 1
}

$image = [System.Drawing.Image]::FromFile($sourcePath)
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graph = [System.Drawing.Graphics]::FromImage($bitmap)
$graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graph.DrawImage($image, 0, 0, $width, $height)

$bitmap.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)

$image.Dispose()
$bitmap.Dispose()
$graph.Dispose()

Remove-Item $sourcePath
Rename-Item $tempPath "icon.png"

Write-Host "Resized to $width x $height"
