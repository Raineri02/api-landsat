// Região do Brasil
var brasil = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.eq('ADM0_NAME', 'Brazil'));

// Função para calcular a LST (temperatura da superfície)
function addLST(image) {
  var radiance = image.select('ST_B10').multiply(0.00341802).add(149.0);
  var brightnessTemp = radiance.expression(
    '(K2 / log((K1 / L) + 1))', {
      'L': radiance,
      'K1': 774.8853,
      'K2': 1321.0789
    });
  var lstCelsius = brightnessTemp.subtract(273.15).rename('LST');
  return image.addBands(lstCelsius);
}

// Parâmetros de tempo
var ano = 2023; // Altere o ano se quiser
var meses = ee.List.sequence(1, 12); // Janeiro a Dezembro

// Loop pelos meses
meses.getInfo().forEach(function(mes) {
  var inicio = ee.Date.fromYMD(ano, mes, 1);
  var fim = inicio.advance(1, 'month');
  
  var colecao = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterBounds(brasil)
    .filterDate(inicio, fim)
    .filter(ee.Filter.lt('CLOUD_COVER', 10))
    .map(addLST);
  
  var imagem = colecao.select('LST').median().clip(brasil);
  
  // Visualiza o primeiro mês no mapa (opcional)
  if (mes === 1) {
    Map.centerObject(brasil, 4);
    Map.addLayer(imagem, {
      min: 20,
      max: 45,
      palette: ['blue', 'green', 'yellow', 'orange', 'red']
    }, 'LST Mês ' + mes);
  }
  
  // Exporta para o Google Drive
  Export.image.toDrive({
    image: imagem,
    description: 'LST_Brasil_' + ano + '_Mes_' + mes,
    folder: 'GEE',
    scale: 1000,
    region: brasil.geometry(),
    maxPixels: 1e13
  });
});

print('Processo concluido!');
