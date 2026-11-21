// Week 13 · Topic 4 — Two-resistance theory and packed-tower design
// Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
//   1/K_y = 1/k_y + m/k_x;  N = K_y (y - m x)
//   (L/V)_min = (y_b - y_a) / (y_b/m - x_a);  A = L/(mV)
//   NTU_OG = ln[(1 - 1/A)(y_b - m x_a)/(y_a - m x_a) + 1/A] / (1 - 1/A);  Z = HTU_OG × NTU_OG
// Build: g++ -O2 -std=c++17 week13_topic4_two_film_packed_tower.cpp -o t4 && ./t4
#include <cmath>
#include <cstdio>

struct TF { double N, yi, xi, Ky, share; };
TF two_film(double y, double x, double m, double ky, double kx) {
  TF r;
  r.Ky = 1.0 / (1.0 / ky + m / kx);
  r.N = r.Ky * (y - m * x);
  r.yi = y - r.N / ky;
  r.xi = x + r.N / kx;
  r.share = (1.0 / ky) / (1.0 / r.Ky);
  return r;
}
double ntu_numeric(double yb, double ya, double xa, double LV, double m, int n = 20000) {
  const double h = (yb - ya) / n;
  double s = 0.0;
  for (int i = 0; i <= n; ++i) {
    const double y = ya + i * h, x = xa + (y - ya) / LV, f = 1.0 / (y - m * x);
    s += f * ((i == 0 || i == n) ? 0.5 : 1.0);
  }
  return s * h;
}
double ntu_colburn(double yb, double ya, double xa, double LV, double m) {
  const double A = LV / m;
  return std::log((1 - 1 / A) * (yb - m * xa) / (ya - m * xa) + 1 / A) / (1 - 1 / A);
}

int main() {
  std::printf("Topic 4 — two-resistance theory and packed-tower design\n\n");
  std::printf("[1] Two films in series: k_y = 1e-3, k_x = 5e-3 kmol/(m2 s), y = 0.05, x = 0\n");
  std::printf("        system          m        K_y          gas-film share   y_i       x_i\n");
  struct Sys { const char* name; double m; };
  const Sys sys[] = {{"very soluble (NH3-like)", 0.8}, {"moderate", 30.0}, {"sparingly soluble (O2-like)", 4.3e4}};
  for (const Sys& s : sys) {
    const TF r = two_film(0.05, 0.0, s.m, 1e-3, 5e-3);
    std::printf("   %-28s %8.3g   %.3e    %6.2f %%      %.5f   %.3e\n", s.name, s.m, r.Ky, r.share * 100, r.yi, r.xi);
  }
  std::printf("   (Small m: gas film controls. Large m: liquid film controls.)\n\n");

  std::printf("[2] Dilute absorber: y_b = 0.020 in, 95%% recovery, clean solvent x_a = 0, m = 1.2\n");
  const double yb = 0.020, xa = 0.0, m = 1.2, ya = yb * (1 - 0.95);
  const double LVmin = (yb - ya) / (yb / m - xa);
  std::printf("   y_a = %.4f,  (L/V)_min = %.4f\n", ya, LVmin);
  const double fs[] = {1.1, 1.5, 2.0, 3.0};
  for (double f : fs) {
    const double LV = f * LVmin, A = LV / m, xb = xa + (yb - ya) / LV;
    std::printf("   L/V = %.1f×min = %.4f   A = %.3f   x_b = %.5f   NTU_OG = %.3f (numerical %.3f)\n",
                f, LV, A, xb, ntu_colburn(yb, ya, xa, LV, m), ntu_numeric(yb, ya, xa, LV, m));
  }
  std::printf("\n");
  std::printf("[3] Height: G_M = 0.020 kmol/(m2 s), K_y a = 0.040 kmol/(m3 s)  ->  HTU_OG = 0.50 m\n");
  const double HTU = 0.020 / 0.040;
  const double gs[] = {1.1, 1.5, 2.0};
  for (double f : gs) std::printf("   L/V = %.1f×min   Z = HTU × NTU = %.2f m\n", f, HTU * ntu_colburn(yb, ya, xa, f * LVmin, m));
  return 0;
}
