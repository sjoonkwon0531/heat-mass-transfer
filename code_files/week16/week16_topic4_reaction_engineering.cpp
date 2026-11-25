// Week 16 · Topic 4 — Final review: mass transfer in reaction engineering
// Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
//   external film (Week 14 lecture form): Sh = 2 + 0.6 Re^1/2 Sc^1/3;  -r'' = kr kc c/(kr + kc)
//   Thiele (sphere, 1st order): phi = R sqrt(k/De), eta = (3/phi^2)(phi coth phi - 1)
//   diffusion-limited carbon burnout: t_f = (rho/M) R0^2 / (12 c D ln 1.042)
//   reaction-limited CVD: d ln G/dT = Ea/(k T^2)
#include <cmath>
#include <cstdio>
#include <initializer_list>

const double KB_EV = 8.617e-5;
double eta_sphere(double phi) { return phi < 1e-6 ? 1.0 : 3.0 / (phi * phi) * (phi / std::tanh(phi) - 1.0); }

int main() {
    std::printf("Topic 4 — mass transfer in reaction engineering\n\n");
    double U = 0.1, dp = 0.01, D = 1e-10, nu = 5e-7, cb = 1000.0;
    std::printf("[1] External film around a 1 cm pellet (lecture example), c_Ab = 1 mol/L\n");
    for (double UU : {U, 2 * U}) {
        double Re = UU * dp / nu, Sc = nu / D, Sh = 2 + 0.6 * std::sqrt(Re) * std::pow(Sc, 1.0 / 3);
        std::printf("   U = %.1f m/s: Re = %.0f, Sc = %.0f, Sh = %.1f, k_c = %.4e m/s\n", UU, Re, Sc, Sh, Sh * D / dp);
    }
    double kc = (2 + 0.6 * std::sqrt(U * dp / nu) * std::pow(nu / D, 1.0 / 3)) * D / dp, kr = 1e-5;
    std::printf("   k_r = 1e-5 m/s: Da = %.3f, rate = %.4e mol/m2 s, c_As/c_Ab = %.4f\n\n", kr / kc, kr * kc / (kr + kc) * cb, kc / (kr + kc));
    std::printf("[2] Internal effectiveness (De = 1e-9 m2/s, rho_c S_a k1 = 0.5 1/s)\n");
    for (double R : {3e-3, 1.5e-3}) {
        double phi = R * std::sqrt(0.5 / 1e-9);
        std::printf("   R = %.1f mm: phi = %.2f, eta = %.4f, 3/phi = %.4f\n", R * 1e3, phi, eta_sphere(phi), 3 / phi);
    }
    for (double phi : {20.0, 5.0}) std::printf("   phi = %4.1f: eta = %.4f\n", phi, eta_sphere(phi));
    std::printf("   apparent activation energy under pore control: E_app = E/2 = %.0f kJ/mol for E = 100\n\n", 100.0 / 2);
    std::printf("[3] Diffusion-limited carbon burnout, R0 = 100 um, rho_C = 2000 kg/m3, 1 atm\n");
    double Ts[2] = {1200.0, 1500.0}, Ds[2] = {2.0e-4, 2.0e-4 * std::pow(1500.0 / 1200.0, 1.75)};
    for (int i = 0; i < 2; ++i) {
        double c = 101325.0 / (8.314 * Ts[i]);
        double tf = (2000.0 / 0.012) * 1e-4 * 1e-4 / (12 * c * Ds[i] * std::log(1.042));
        std::printf("   T = %.0f K: c = %.2f mol/m3, D = %.3e m2/s, t_f = %.3f s\n", Ts[i], c, Ds[i], tf);
    }
    std::printf("\n");
    double Ea = 1.9, T = 973.15, s = Ea / (KB_EV * T * T);
    std::printf("[4] Reaction-limited LPCVD, Ea = 1.9 eV at 700 C\n");
    std::printf("   d ln G/dT = %.4f 1/K -> +/-1%% thickness needs +/-%.2f K\n", s, 0.01 / s);
    std::printf("   G(700 C)/G(650 C) = %.2f\n", std::exp(Ea / KB_EV * (1 / 923.15 - 1 / 973.15)));
    return 0;
}
