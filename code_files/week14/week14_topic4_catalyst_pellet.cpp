// Week 14 · Topic 4 — Mass transfer for reaction engineering: external film, packed bed, Thiele modulus
// Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
//   Sh = 2 + 0.6 Re^(1/2) Sc^(1/3);  r'' = k_r k_c c_Ab/(k_r + k_c);  c_A/c_A0 = exp(-k_c a_c z/U)
//   eta = (3/phi^2)(phi coth phi - 1);  Omega = eta/(1 + eta k/(k_c a_c))
// Build: g++ -O2 -std=c++17 week14_topic4_catalyst_pellet.cpp -o t4 && ./t4
#include <cmath>
#include <cstdio>

void froessling(double U, double dp, double D, double nu, double& Re, double& Sc, double& Sh, double& kc) {
  Re = U * dp / nu; Sc = nu / D; Sh = 2 + 0.6 * std::sqrt(Re) * std::cbrt(Sc); kc = Sh * D / dp;
}
double eta_sphere(double phi) { return phi < 1e-4 ? 1.0 : 3.0 / (phi * phi) * (phi / std::tanh(phi) - 1.0); }

int main() {
  std::printf("Topic 4 — external film, packed bed, and internal diffusion\n\n");
  std::printf("[1] Lecture example: d_p = 1 cm, U = 0.1 m/s, D_AB = 1e-10 m2/s, nu = 5e-7 m2/s, c_Ab = 1 mol/L\n");
  double Re, Sc, Sh, kc;
  froessling(0.1, 0.01, 1e-10, 5e-7, Re, Sc, Sh, kc);
  std::printf("   Re = %.0f, Sc = %.0f, Sh = %.1f, k_c = %.3e m/s\n", Re, Sc, Sh, kc);
  std::printf("   instantaneous surface reaction: n_A = k_c c_Ab = %.3e mol/(m2 s)\n\n", kc * 1000);
  std::printf("[2] Finite surface rate: Da = k_r/k_c\n");
  const double Das[] = {0.01, 0.1, 1, 10, 100};
  for (double Da : Das) {
    const double kr = Da * kc;
    std::printf("   Da = %7.2f   c_As/c_Ab = %.4f   rate = %.3e mol/(m2 s)\n", Da, kc / (kr + kc), kr * kc / (kr + kc) * 1000);
  }
  std::printf("   (Da << 1: reaction-limited; Da >> 1: transport-limited.)\n\n");
  std::printf("[3] Sensitivity of k_c in the transport-limited regime (Sh >> 2): k_c ∝ U^(1/2) d_p^(-1/2) D^(2/3) nu^(-1/6)\n");
  const double Us[] = {0.05, 0.1, 0.2, 0.4};
  for (double U : Us) {
    double a, b, c, k;
    froessling(U, 0.01, 1e-10, 5e-7, a, b, c, k);
    std::printf("   U = %.2f m/s   k_c = %.3e m/s\n", U, k);
  }
  std::printf("\n");
  std::printf("[4] Mass-transfer-limited packed bed (d_p = 1 cm, bed porosity 0.4, U = 0.1 m/s superficial)\n");
  const double ac = 6 * (1 - 0.4) / 0.01;
  const double zs[] = {0.1, 0.5, 1.0, 2.0, 5.0};
  for (double z : zs) {
    const double r = std::exp(-kc * ac * z / 0.1);
    std::printf("   z = %4.1f m   c_A/c_A0 = %.4f   conversion = %.4f\n", z, r, 1 - r);
  }
  std::printf("   a_c = %.0f m2/m3\n\n", ac);
  std::printf("[5] Internal effectiveness factor of a sphere\n");
  std::printf("      phi1      eta        3/phi1\n");
  const double phis[] = {0.1, 0.5, 1, 2, 5, 10, 20};
  for (double p : phis) std::printf("   %7.2f   %.4f    %.4f\n", p, eta_sphere(p), 3 / p);
  std::printf("\n");
  std::printf("[6] Overall effectiveness Omega with the external film (k = 2e-3 1/s, k_c a_c from [1] and [4])\n");
  const double kbed = 2e-3;
  const double ps[] = {0.5, 2, 10};
  for (double p : ps) {
    const double eta = eta_sphere(p), Om = eta / (1 + eta * kbed / (kc * ac));
    std::printf("   phi1 = %5.1f   eta = %.4f   k_c a_c = %.3e 1/s   Omega = %.4e\n", p, eta, kc * ac, Om);
  }
  return 0;
}
