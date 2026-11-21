// Week 13 · Topic 3 — Confined flows: pipes and packed beds
// Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
//   Gilliland & Sherwood: Sh (p_B,lm/P) = 0.023 Re^0.83 Sc^0.44;  Linton & Sherwood: Sh = 0.023 Re^0.83 Sc^(1/3)
//   Laminar tube: Sh = 1.86 (Re Sc d/L)^(1/3);  packed bed: j_D = 1.17 Re^-0.415
//   Wilson & Geankoplis (liquids): eps j_D = 1.09 Re^(-2/3) (Re < 55), 0.250 Re^(-0.31) (55 < Re < 1500)
// Build: g++ -O2 -std=c++17 week13_topic3_pipe_packed_bed.cpp -o t3 && ./t3
#include <cmath>
#include <cstdio>

double sh_gilliland(double Re, double Sc, double pB = 1.0) { return 0.023 * std::pow(Re, 0.83) * std::pow(Sc, 0.44) / pB; }
double sh_linton(double Re, double Sc) { return 0.023 * std::pow(Re, 0.83) * std::cbrt(Sc); }
double sh_laminar_tube(double Re, double Sc, double dL) { return 1.86 * std::cbrt(Re * Sc * dL); }
double jD_packed_gas(double Re) { return 1.17 * std::pow(Re, -0.415); }
double eps_jD_wilson(double Re) { return Re < 55 ? 1.09 * std::pow(Re, -2.0 / 3) : 0.250 * std::pow(Re, -0.31); }

int main() {
  std::printf("Topic 3 — pipes and packed beds\n\n");
  {
    std::printf("[1] Water evaporating into air in a wetted-wall tube (d = 2.5 cm, v = 3 m/s, 25 C)\n");
    const double d = 0.025, v = 3.0, nu = 1.55e-5, D = 2.6e-5, Re = v * d / nu, Sc = nu / D, Sh = sh_gilliland(Re, Sc);
    std::printf("   Re = %.0f, Sc = %.3f, Sh = %.2f, k_c = %.4f m/s  (p_B,lm/P taken as 1)\n\n", Re, Sc, Sh, Sh * D / d);
  }
  {
    std::printf("[2] Benzoic acid lining a pipe, water flow (d = 2.5 cm, Re = 1e4, Sc = 1000, D = 1e-9 m2/s)\n");
    const double Sh = sh_linton(1e4, 1000.0);
    std::printf("   Linton-Sherwood: Sh = %.1f, k_c = %.3e m/s\n\n", Sh, Sh * 1e-9 / 0.025);
  }
  std::printf("[3] Laminar tube, Re = 500, Sc = 1000: effect of the length\n");
  const int Ls[] = {10, 100, 1000};
  for (int L : Ls) std::printf("   L/d = %5d   Sh = %.2f\n", L, sh_laminar_tube(500, 1000, 1.0 / L));
  std::printf("   (Longer tubes give a smaller mean Sh: the concentration layer keeps thickening.)\n\n");
  {
    std::printf("[4] Water through a bed of benzoic acid spheres (d_p = 6 mm, v' = 1 mm/s, eps = 0.40, Sc = 1000)\n");
    const double dp = 6e-3, vs = 1e-3, nu = 8.9e-7, eps = 0.40, Sc = 1000.0, D = 8.9e-10;
    const double Re = dp * vs / nu, jD = eps_jD_wilson(Re) / eps, kc = jD * vs / std::pow(Sc, 2.0 / 3);
    std::printf("   Re = %.2f  ->  eps j_D = %.4f, j_D = %.4f, k_c = %.3e m/s\n", Re, eps_jD_wilson(Re), jD, kc);
    std::printf("   Sh = k_c d_p / D = %.2f\n", kc * dp / D);
    std::printf("   continuity check at Re = 55: %.4f vs %.4f\n\n", 1.09 * std::pow(55.0, -2.0 / 3), 0.250 * std::pow(55.0, -0.31));
  }
  std::printf("[5] Gas through a packed bed: j_D = 1.17 Re^-0.415\n");
  const int Rs[] = {10, 100, 1000, 2500};
  for (int Re : Rs) std::printf("   Re = %5d   j_D = %.4f\n", Re, jD_packed_gas(Re));
  return 0;
}
