//----------------------------------------------------------------------
// Москаленко Андрій 
// Група ІМ-42, КПІ, 2025
//----------------------------------------------------------------------


// IMORT
//----------------------------------------------------------------------
// Стандартний модуль HTTP-сервера.
const http = require('http');
// Модуль для роботи з файловою системою — читання й запис файлів
const fs = require('fs');
// Модуль для правильного формування шляхів до файлів, незалежно від ОС
const path = require('path');


// DATAFILE
//----------------------------------------------------------------------

// __dirname — змінна, якамістить повний абсолютний шлях до папки, в якій знаходиться файл, що виконується
const DATA_FILE = path.join(__dirname, 'data.json');


// SERVER
//----------------------------------------------------------------------

// Сервер буде слухати цей порт
const PORT = 5000;

// Налаштування CORS (Cross-Origin Resource Sharing)
const corsHeaders = {
  'Access-Control-Allow-Origin':  'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};


// Створюємо сервер
const server = http.createServer((req, res) => {

  // Перевірка дозволу на звернення
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
  }
  // Повернути збережені у файлі дані 
  else if (req.method === 'GET' && req.url === '/load') {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end('[]'); // якщо ще нема файлу
      } 
      else {
        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(data);
      }
    });
  } 
  // Зберегти дані у файлі
  else if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      fs.writeFile(DATA_FILE, body, err => {
        res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ status: err ? 'error' : 'saved' }));
      });
    });
  } 
  // Запит не розпізнано
  else {
    res.writeHead(404);
    res.end('Not found');
  }
});


// Запускаємо сервер
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});