// Week 13 · Topic 2 — Creeping flow past a sphere: Stokes drag, terminal velocity, and Sh(Pe)
// Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
//   F_D = 6 pi mu U R,  U_T = 2 R^2 (rho_p - rho) g / (9 mu)
//   Pe << 1 (Acrivos & Taylor, Pe = U R / D): Sh = 2[1 + Pe/4 + (Pe^2/8) ln Pe + 0.01702 Pe^2 + (Pe^3/32) ln Pe]
//   Pe >> 1: Sh = 1.249 Pe^(1/3);  Brian & Hales: Sh = (4 + 1.21 Pe_d^(2/3))^(1/2);  Froessling: Sh = 2 + 0.552 Re^(1/2) Sc^(1/3)
// Build: g++ -O2 -std=c++17 week13_topic2_sphere_creeping.cpp -o t2 && ./t2
#include <cmath>
#include <cstdio>

const double G = 9.81;
double stokes_terminal(double R, double drho, double mu) { return 2.0 * R * R * drho * G / (9.0 * mu); }
double sh_small_pe(double Pe) {
  if (Pe <= 0) return 2.0;
  const double L = std::log(Pe);
  return 2.0 * (1 + Pe / 4 + Pe * Pe / 8 * L + 0.01702 * Pe * Pe + Pe * Pe * Pe / 32 * L);
}
double sh_large_pe(double Pe) { return 1.249 * std::cbrt(Pe); }
double sh_brian_hales(double Ped) { return std::sqrt(4.0 + 1.21 * std::pow(Ped, 2.0 / 3)); }
double sh_froessling(double Re, double Sc) { return 2.0 + 0.552 * std::sqrt(Re) * std::cbrt(Sc); }

int main() {
  const double PI = std::acos(-1.0);
  std::printf("Topic 2 — creeping flow past a sphere\n\n");
  std::printf("[1] Stokes terminal velocity  U_T = 2 R^2 (rho_p - rho) g / (9 mu)\n");
  struct Case { const char* name; double R, drho, mu, rho; };
  const Case cases[] = {
      {"1 um silica in water (CMP slurry)", 0.5e-6, 2200 - 997, 8.9e-4, 997},
      {"10 um water droplet in air", 5e-6, 1000 - 1.18, 1.8e-5, 1.18},
      {"100 um sand grain in water", 50e-6, 2650 - 997, 8.9e-4, 997}};
  for (const Case& c : cases) {
    const double U = stokes_terminal(c.R, c.drho, c.mu);
    const double Re = c.rho * U * 2 * c.R / c.mu, F = 6 * PI * c.mu * U * c.R;
    std::printf("   %-34s U_T = %.3e m/s   Re = %.2e   F_D = %.3e N\n", c.name, U, Re, F);
  }
  std::printf("   (Stokes' law needs Re << 1; the 100 um grain is already at Re ~ 1, the edge of validity.)\n\n");

  std::printf("[2] Sherwood number of a sphere versus Pe = U R / D   (Sh based on the diameter)\n");
  std::printf("     Pe       Acrivos-Taylor   1.249 Pe^(1/3)   Brian-Hales(Pe_d = 2 Pe)\n");
  const double Pes[] = {0.01, 0.1, 0.5, 1, 10, 100, 1000, 1e4};
  for (double Pe : Pes) {
    const double st = Pe <= 1 ? sh_small_pe(Pe) : NAN;
    std::printf("   %7.2g   %12.4f   %12.3f   %12.3f\n", Pe, st, sh_large_pe(Pe), sh_brian_hales(2 * Pe));
  }
  std::printf("   Same law in two notations: 1.249 Pe^(1/3) = 1.249 (Pe_d/2)^(1/3) = %.3f Pe_d^(1/3)\n\n", 1.249 / std::cbrt(2.0));

  std::printf("[3] Shape factors for Pe << 1 (Sh on length L)\n");
  std::printf("   %-36s Sh = %.3f\n", "sphere, L = 2R", 2.0);
  std::printf("   %-36s Sh = %.3f\n", "oblate spheroid a/b = 1/2, L = 2b", 2.40);
  std::printf("   %-36s Sh = %.3f\n", "circular disk, L = 2R", 8 / PI);
  std::printf("   %-36s Sh = %.3f\n", "square plate, L = a", PI / std::log(4.0));
  std::printf("\n");

  std::printf("[4] Froessling: 1 mm naphthalene sphere in air at 1 m/s (nu = 1.55e-5, D = 6.1e-6 m2/s)\n");
  const double d = 1e-3, U = 1.0, nu = 1.55e-5, D = 6.1e-6;
  const double Re = U * d / nu, Sc = nu / D, Sh = sh_froessling(Re, Sc);
  std::printf("   Re = %.1f, Sc = %.3f, Sh = %.3f, k_c = %.4f m/s\n", Re, Sc, Sh, Sh * D / d);
  return 0;
}
