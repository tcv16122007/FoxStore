const SLIDES = [
  { img: "https://nguyencongpc.vn/media/lib/19-03-2022/125536448_2773928059592415_9013621775008855715_n.jpg", title: "Gaming Gear Chính Hãng", desc: "Chuột, bàn phím, tai nghe - giảm đến 40%", cta: "Mua ngay" },
  { img: "https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2024/05/top-phu-kien-laptop-3.jpg", title: "Phụ kiện Laptop Cao Cấp", desc: "Hub, đế tản nhiệt, balo - bảo hành 24 tháng", cta: "Khám phá" },
  { img: "https://png.pngtree.com/png-clipart/20200225/original/pngtree-flash-sale-discount-banner-template-promotion-png-image_5305494.jpg", title: "Flash Sale Cuối Tuần", desc: "Sốc giá - chỉ từ 290.000₫", cta: "Xem ưu đãi" }
];

let currentSlide = 0;
let sliderTimer = null;

function renderSlider() {
  const box = document.getElementById("slider");
  if (!box) return;
  box.innerHTML = SLIDES.map((s, i) => `
    <div class="slide ${i === 0 ? 'active' : ''}" style="background-image: linear-gradient(90deg, rgba(0,0,0,.85), rgba(0,0,0,.3)), url('${s.img}')">
      <div class="slide-content">
        <h2>${s.title}</h2><p>${s.desc}</p>
        <a href="category.html" class="btn">${s.cta}</a>
      </div>
    </div>
  `).join("") + `
    <button class="slider-btn prev" onclick="changeSlide(-1)">‹</button>
    <button class="slider-btn next" onclick="changeSlide(1)">›</button>
    <div class="slider-dots">
      ${SLIDES.map((_, i) => `<button class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></button>`).join("")}
    </div>`;
  autoPlay();
}
function goToSlide(i) {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".dot");
  if (!slides.length) return;
  slides[currentSlide].classList.remove("active");
  dots[currentSlide]?.classList.remove("active");
  currentSlide = (i + SLIDES.length) % SLIDES.length;
  slides[currentSlide].classList.add("active");
  dots[currentSlide]?.classList.add("active");
}
function changeSlide(step) { goToSlide(currentSlide + step); }
function autoPlay() {
  clearInterval(sliderTimer);
  sliderTimer = setInterval(() => changeSlide(1), 5000);
}