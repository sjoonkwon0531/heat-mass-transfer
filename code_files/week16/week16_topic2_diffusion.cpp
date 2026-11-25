// Week 16 · Topic 2 — Final review: steady and unsteady molecular diffusion
// Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
//   Stefan tube: N_A = (cD/L) ln[(1 - yA2)/(1 - yA1)];  Deal-Grove: x^2 + A x = B t
//   Hatta: Ha = delta sqrt(k1/D), E = Ha/tanh(Ha);  semi-infinite: erfc(z/(2 sqrt(D t)))
//   slab uptake: M/Minf = 1 - sum 8/((2k-1)^2 pi^2) exp(-(2k-1)^2 pi^2 Fo)
//   sphere release: m/m0 = (6/pi^2) sum (1/n^2) exp(-n^2 pi^2 tau)
#include <cmath>
#include <cstdio>
#include <initializer_list>
#include <functional>

const double KB_EV = 8.617e-5;

double bisect(std::function<double(double)> f, double lo, double hi, int n = 200) {
    double flo = f(lo);
    for (int i = 0; i < n; ++i) {
        double m = 0.5 * (lo + hi), fm = f(m);
        if ((fm > 0) == (flo > 0)) { lo = m; flo = fm; } else hi = m;
    }
    return 0.5 * (lo + hi);
}

double slab_uptake(double Fo) {
    double s = 0;
    for (int k = 1; k < 400; ++k) { double a = (2.0 * k - 1) * (2.0 * k - 1) * M_PI * M_PI; s += 8.0 / a * std::exp(-a * Fo); }
    return 1.0 - s;
}

double sphere_left(double tau) {
    double s = 0;
    for (int n = 1; n < 400; ++n) s += std::exp(-(double)n * n * M_PI * M_PI * tau) / ((double)n * n);
    return 6.0 / (M_PI * M_PI) * s;
}

int main() {
    std::printf("Topic 2 — steady and unsteady molecular diffusion\n\n");
    double P = 101325.0, T = 298.15, L = 0.08, D = 1.25e-5, pv = 7830.0;
    double c = P / (8.314 * T), y1 = pv / P, N = c * D / L * std::log(1 / (1 - y1)), Nf = c * D * y1 / L;
    std::printf("[1] Stefan tube (ethanol, 25 C, 1 atm, L = 8 cm, D = 0.125 cm2/s)\n");
    std::printf("   c = %.2f mol/m3, yA1 = %.4f, N_A = %.4e mol/m2 s, Fick = %.4e (ratio %.4f)\n", c, y1, N, Nf, N / Nf);
    std::printf("   daily loss = %.3f kg/m2\n\n", N * 0.04607 * 86400);
    std::printf("[2] Deal-Grove, dry O2 on (111) Si, target x = 0.1 um\n");
    for (double Tc : {1100.0, 1000.0}) {
        double Tk = Tc + 273.15, B = 772.0 * std::exp(-1.23 / (KB_EV * Tk)), BA = 6.23e6 * std::exp(-2.0 / (KB_EV * Tk)), A = B / BA;
        std::printf("   %4.0f C: B = %.4f um2/h, B/A = %.4f um/h, A = %.4f um, t = %.3f h\n", Tc, B, BA, A, (0.1 * 0.1 + A * 0.1) / B);
    }
    std::printf("\n");
    double k1 = 8.5e3 * 0.2, Dc = 1.9e-9, d = 40e-6, Ha = d * std::sqrt(k1 / Dc);
    std::printf("[3] Reactive absorption of CO2 in 0.2 M NaOH: k1 = %.0f 1/s\n", k1);
    std::printf("   Ha = %.2f, E = %.2f, k_c(phys) = %.3e m/s, k_c(react) = %.3e m/s\n\n", Ha, Ha / std::tanh(Ha), Dc / d, std::sqrt(Dc * k1));
    double target = 1e17 / 2.5e20;
    double phi = bisect([&](double p) { return std::erfc(p) - target; }, 0.0, 6.0);
    std::printf("[4] Junction depth: erfc(phi) = %.1e -> phi = %.4f, z = %.3f um\n\n", target, phi, 2 * phi * std::sqrt(6.5e-13 * 1800.0) * 1e4);
    std::printf("[5] Slab uptake (both faces, L = 50 um, D = 1e-12 m2/s)\n");
    for (double f : {0.5, 0.9}) {
        double Fo = bisect([&](double x) { return slab_uptake(x) - f; }, 1e-6, 2.0);
        std::printf("   M/Minf = %.1f: Fo = %.4f, t = %.1f s\n", f, Fo, Fo * 50e-6 * 50e-6 / 1e-12);
    }
    std::printf("   short-time form 4 sqrt(Fo/pi) = 0.5 -> Fo = %.4f\n\n", M_PI / 64);
    std::printf("[6] Sphere release (R = 0.5 mm, D = 1e-11 m2/s)\n");
    for (double left : {0.5, 0.1}) {
        double tau = bisect([&](double x) { return sphere_left(x) - left; }, 1e-6, 2.0);
        std::printf("   m/m0 = %.1f: tau = %.4f, t = %.1f min\n", left, tau, tau * 0.5e-3 * 0.5e-3 / 1e-11 / 60);
    }
    std::printf("   one-term (6/pi^2) exp(-pi^2 tau) = 0.1 -> tau = %.4f\n", std::log(6 / (M_PI * M_PI) / 0.1) / (M_PI * M_PI));
    return 0;
}
