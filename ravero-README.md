# 🍽️ Ravero — نظام المطعم الذكي

## تشغيل الخادم محلياً
```bash
cd ravero
npm install
node server.js
```
الخادم يعمل على: http://localhost:3001

## بيانات الدخول التجريبية
| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| مدير | admin@ravero.com | admin123 |
| كاشير | cashier@ravero.com | cashier123 |
| مطبخ | kitchen@ravero.com | kitchen123 |
| سائق | driver@ravero.com | driver123 |

## APIs المتاحة
- POST /api/auth/login
- GET  /api/menu
- POST /api/orders
- GET  /api/orders
- PUT  /api/orders/:id/status
- GET  /api/inventory
- GET  /api/customers
- GET  /api/analytics/dashboard
- GET  /api/analytics/revenue
- GET  /api/tables
- GET  /api/coupons
- POST /api/coupons/validate

## Socket.io Events
- order:new → طلب جديد
- order:status_updated → تحديث حالة الطلب
- inventory:low → تحذير المخزون
- driver:location_update → موقع السائق
