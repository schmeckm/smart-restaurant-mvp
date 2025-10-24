# ==========================================
# SMART RESTAURANT API TEST
# ==========================================

$baseUrl = "http://localhost:3000/api/v1"

Write-Host "🔐 Login..." -ForegroundColor Yellow

# 1. Login
$loginBody = @{
    email = "admin@restaurant.com"
    password = "Admin123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.data.token

Write-Host "✅ Token erhalten!" -ForegroundColor Green
Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Cyan

# Headers für alle weiteren Requests
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Zutat erstellen
Write-Host "`n📦 Erstelle Zutaten..." -ForegroundColor Yellow

$ingredients = @(
    @{ name = "Mehl"; unit = "kg"; cost_per_unit = 1.20; stock_quantity = 50; min_stock = 10; category = "Backwaren" },
    @{ name = "Tomatensauce"; unit = "l"; cost_per_unit = 3.00; stock_quantity = 20; min_stock = 5; category = "Saucen" },
    @{ name = "Mozzarella"; unit = "kg"; cost_per_unit = 8.00; stock_quantity = 15; min_stock = 3; category = "Käse" },
    @{ name = "Olivenöl"; unit = "l"; cost_per_unit = 15.00; stock_quantity = 10; min_stock = 2; category = "Öle" }
)

$createdIngredients = @()

foreach ($ing in $ingredients) {
    $ingBody = $ing | ConvertTo-Json
    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/ingredients" -Method POST -Headers $headers -Body $ingBody
        $createdIngredients += $result.data
        Write-Host "✅ $($result.data.name) erstellt (ID: $($result.data.id))" -ForegroundColor Green
    } catch {
        Write-Host "❌ Fehler bei $($ing.name): $_" -ForegroundColor Red
    }
}

# 3. Alle Zutaten anzeigen
Write-Host "`n📋 Lade alle Zutaten..." -ForegroundColor Yellow
$allIngredients = Invoke-RestMethod -Uri "$baseUrl/ingredients" -Method GET -Headers $headers
Write-Host "✅ $($allIngredients.data.total) Zutaten gefunden" -ForegroundColor Green

# 4. Produkt erstellen (falls noch keins da)
Write-Host "`n🍕 Erstelle Produkt..." -ForegroundColor Yellow
$productBody = @{
    name = "Margherita Pizza"
    category = "Pizza"
    price = 8.99
    cost = 0
    description = "Klassische Pizza mit Tomaten und Mozzarella"
    is_available = $true
} | ConvertTo-Json

try {
    $product = Invoke-RestMethod -Uri "$baseUrl/products" -Method POST -Headers $headers -Body $productBody
    Write-Host "✅ Produkt erstellt: $($product.data.name)" -ForegroundColor Green
    $productId = $product.data.id
} catch {
    Write-Host "⚠️ Produkt existiert möglicherweise schon" -ForegroundColor Yellow
    # Hole erstes Produkt
    $products = Invoke-RestMethod -Uri "$baseUrl/products?limit=1" -Method GET -Headers $headers
    $productId = $products.data.products[0].id
    Write-Host "✅ Verwende existierendes Produkt: $productId" -ForegroundColor Green
}

# 5. Rezept erstellen
Write-Host "`n📖 Erstelle Rezept..." -ForegroundColor Yellow

$recipeIngredients = @()
foreach ($ing in $createdIngredients) {
    $quantity = switch ($ing.name) {
        "Mehl" { 0.25 }
        "Tomatensauce" { 0.15 }
        "Mozzarella" { 0.20 }
        "Olivenöl" { 0.01 }
    }
    $recipeIngredients += @{
        ingredient_id = $ing.id
        quantity = $quantity
    }
}

$recipeBody = @{
    product_id = $productId
    name = "Margherita Pizza Rezept"
    instructions = "1. Teig aus Mehl vorbereiten`n2. Tomatensauce auftragen`n3. Mozzarella verteilen`n4. Mit Olivenöl beträufeln`n5. Bei 250°C 12 Min. backen"
    prep_time = 15
    portions = 1
    ingredients = $recipeIngredients
} | ConvertTo-Json -Depth 10

try {
    $recipe = Invoke-RestMethod -Uri "$baseUrl/recipes" -Method POST -Headers $headers -Body $recipeBody
    Write-Host "✅ Rezept erstellt!" -ForegroundColor Green
    Write-Host "`nRezept Details:" -ForegroundColor Cyan
    Write-Host "  Name: $($recipe.data.name)"
    Write-Host "  Zutaten: $($recipe.data.recipeIngredients.Count)"
    Write-Host "  Zubereitungszeit: $($recipe.data.prep_time) Min."
} catch {
    Write-Host "❌ Fehler beim Erstellen des Rezepts: $_" -ForegroundColor Red
}

# 6. Rezept Details abrufen mit Kostenberechnung
Write-Host "`n💰 Lade Rezept mit Kostenberechnung..." -ForegroundColor Yellow
try {
    $recipeDetails = Invoke-RestMethod -Uri "$baseUrl/recipes/$($recipe.data.id)" -Method GET -Headers $headers
    Write-Host "✅ Rezept geladen:" -ForegroundColor Green
    Write-Host "  Gesamtkosten: €$($recipeDetails.data.totalCost)" -ForegroundColor Yellow
    Write-Host "  Verkaufspreis: €$($recipeDetails.data.product.price)" -ForegroundColor Green
    Write-Host "  Gewinn: €$($recipeDetails.data.profit)" -ForegroundColor Green
    Write-Host "  Gewinnmarge: $($recipeDetails.data.profitMargin)%" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Konnte Rezept-Details nicht laden" -ForegroundColor Yellow
}

Write-Host "`n✅ Test abgeschlossen!" -ForegroundColor Green