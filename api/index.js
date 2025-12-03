// api/index.js
// ESTE ARCHIVO YA NO ES NECESARIO.
// La aplicación ahora se conecta directamente a Google Firebase desde el navegador (Frontend).
// Se mantiene este archivo solo como referencia histórica o por si decides volver a SQL en el futuro.

export default async function handler(req, res) {
  res.status(200).json({ 
    message: "API Serverless desactivada. La app está utilizando Google Firebase Firestore." 
  });
}