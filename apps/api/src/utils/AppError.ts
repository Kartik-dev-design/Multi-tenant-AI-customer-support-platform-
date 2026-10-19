export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}
// yeh ek simple erorr class banao hain jisse hum eeror messge baar 
// likhna naa padhde har jagah directly ho jaye 
//ek simple consstructor bana diya hain jisse hum error message aur status code pass karenge aur ye class usse handle karegi
