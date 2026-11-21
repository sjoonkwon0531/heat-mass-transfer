// Week 13 · Topic 1 — Flat-plate correlations, the unheated starting length, and the CVD example
// Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
//   Laminar (Re_L < 2e5):   Sh_L = 0.664 Re_L^(1/2) Sc^(1/3)
//   Turbulent (Re_L > 2e5): Sh_L = 0.0365 Re_L^(4/5) Sc^(1/3)
//   Wall active from x = X: Sh_x = 0.332 Re_x^(1/2) [Sc / (1 - (X/x)^(3/4))]^(1/3)
// Build: g++ -O2 -std=c++17 week13_topic1_flat_plate_cvd.cpp -o t1 && ./t1
#include <cmath>
#include <cstdio>

double sh_plate_mean(double Re, double Sc) {
  if (Re < 2e5) return 0.664 * std::pow(Re, 0.5) * std::cbrt(Sc);
  return 0.0365 * std::pow(Re, 0.8) * std::cbrt(Sc);
}
double jD_plate(double Re) { return Re < 2e5 ? 0.664 * std::pow(Re, -0.5) : 0.0365 * std::pow(Re, -0.2); }
double sh_x_entrance(double Rex, double Sc, double Xx) {
  return 0.332 * std::sqrt(Rex) * std::cbrt(Sc / (1.0 - std::pow(Xx, 0.75)));
}

int main() {
  std::printf("Topic 1 — flat-plate correlations and the CVD example\n\n");
  std::printf("[1] Mean Sh and j_D on a flat plate (Sc = 1)\n");
  std::printf("   Re_L       regime      Sh_L        j_D\n");
  const double Res[] = {1e3, 1e4, 1e5, 1.99e5, 2.01e5, 1e6, 1e7};
  for (double Re : Res) {
    const char* reg = Re < 2e5 ? "laminar" : "turbulent";
    std::printf("   %8.2e  %-10s %10.2f  %.5f\n", Re, reg, sh_plate_mean(Re, 1.0), jD_plate(Re));
  }
  std::printf("   (Check: j_D = Sh / (Re Sc^(1/3)) equals C_f/2 for a flat plate.)\n\n");

  std::printf("[2] Entrance (unheated starting length) factor [1 - (X/x)^(3/4)]^(-1/3)\n");
  const double rs[] = {0.0, 0.2, 0.44444, 0.6, 0.8, 0.9, 0.99};
  for (double r : rs) std::printf("   X/x = %6.4f   factor = %6.3f\n", r, std::pow(1 - std::pow(r, 0.75), -1.0 / 3));
  std::printf("\n");

  std::printf("[3] CVD example: v = 100 cm/s, nu = 5.686 cm2/s, D_AB = 1.55 cm2/s, X = 4 cm, x = 9 cm\n");
  const double v = 100.0, nu = 5.686, D = 1.55, X = 4.0, x = 9.0;
  const double Re = v * x / nu, Sc = nu / D;
  const double Sh = sh_x_entrance(Re, Sc, X / x), kc = Sh * D / x;
  const double ratio = std::cbrt(Sc / (1 - std::pow(X / x, 0.75)));
  std::printf("   Re_x = %.1f (laminar),  Sc = %.3f\n", Re, Sc);
  std::printf("   entrance factor (Sc/(1-(X/x)^0.75))^(1/3) = %.3f\n", ratio);
  std::printf("   Sh_x = %.3f   ->   k_c = Sh D / x = %.3f cm/s\n", Sh, kc);
  const double dM = 4.79 * x / std::sqrt(Re), dc = dM / ratio, kf = D / dc;
  std::printf("   delta_M = 4.79 x / Re^(1/2) = %.3f cm,  delta_M/delta_c = %.3f,  delta_c = %.3f cm\n", dM, ratio, dc);
  std::printf("   film theory k_c = D/delta_c = %.3f cm/s   (%.0f%% below the BL result)\n", kf, (1 - kf / kc) * 100);
  std::printf("   with the cubic-profile wall gradient 3/2: k_c = 1.5 D/delta_c = %.3f cm/s\n", 1.5 * kf);
  return 0;
}
