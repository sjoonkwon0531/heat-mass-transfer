// Week 11 - Topic 2: Transient Diffusion in a Sphere - Drug Release from a Gel Bead
// Lecture (Part 1):
//   dc/dt = D (d2c/dr2 + (2/r) dc/dr),  c(R,t) = cs = 0 (perfect sink),  dc/dr(0,t) = 0,  c(r,0) = c0
//   (c - c0)/(cs - c0) = 1 + (2R/(pi r)) sum_n (-1)^n/n sin(n pi r/R) exp(-n^2 pi^2 D t/R^2)
//   centre (r -> 0, sin x/x -> 1):  (c(0,t) - c0)/(cs - c0) = 1 + 2 sum_n (-1)^n exp(-n^2 pi^2 tau)
//   release rate   W(t) = 8 pi c0 D R sum_n exp(-n^2 pi^2 tau)
//   remaining      m(t)/m0 = (6/pi^2) sum_n (1/n^2) exp(-n^2 pi^2 tau),   tau = D t / R^2
//   long times (one term): m/m0 ~ (6/pi^2) exp(-pi^2 tau)  (the lecture writes ~ exp(-pi^2 tau))
//   short times: released fraction ~ 6 sqrt(tau/pi) - 3 tau  (semi-infinite limit with curvature)
// Build: g++ -O2 -std=c++17 week11_topic2_sphere_release.cpp -o topic2
#include <cmath>
#include <cstdio>
#include <initializer_list>
#include <utility>
#include <vector>

const double PI = 3.14159265358979323846;

double remainingFraction(double tau, int nterms = 400) {
    if (tau <= 0) return 1.0;
    double s = 0.0;
    for (int n = 1; n <= nterms; ++n) s += std::exp(-std::pow(n * PI, 2) * tau) / (double(n) * n);
    return 6.0 / (PI * PI) * s;
}

double theta(double rho, double tau, int nterms = 400) {
    if (tau <= 0) return 1.0;
    double s = 0.0;
    for (int n = 1; n <= nterms; ++n) {
        double e = std::exp(-std::pow(n * PI, 2) * tau);
        if (e < 1e-300) break;
        double shape = rho < 1e-12 ? n * PI : std::sin(n * PI * rho) / rho;
        s += 2.0 * ((n % 2) ? 1.0 : -1.0) / (n * PI) * shape * e;
    }
    return s;
}

double tauFor(double remaining) {
    double lo = 1e-8, hi = 5.0;
    for (int i = 0; i < 200; ++i) {
        double mid = std::sqrt(lo * hi);
        if (remainingFraction(mid) > remaining) lo = mid; else hi = mid;
    }
    return std::sqrt(lo * hi);
}

std::pair<double, double> finiteVolume(double tauEnd, int N = 200, int steps = 40000) {
    double dr = 1.0 / N, dt = tauEnd / steps;
    std::vector<double> vol(N), area(N), c(N, 1.0), flux(N), nw(N);
    for (int i = 0; i < N; ++i) {
        vol[i] = (std::pow(i + 1, 3) - std::pow(i, 3)) * dr * dr * dr / 3.0;
        area[i] = std::pow(i + 1, 2) * dr * dr;
    }
    for (int s = 0; s < steps; ++s) {
        for (int i = 0; i < N - 1; ++i) flux[i] = -area[i] * (c[i + 1] - c[i]) / dr;
        flux[N - 1] = -area[N - 1] * (0.0 - c[N - 1]) / (0.5 * dr);
        for (int i = 0; i < N; ++i) {
            double inflow = (i > 0 ? flux[i - 1] : 0.0) - flux[i];
            nw[i] = c[i] + dt * inflow / vol[i];
        }
        c = nw;
    }
    double m = 0.0;
    for (int i = 0; i < N; ++i) m += c[i] * vol[i];
    return {c[0], 3.0 * m};
}

int main() {
    std::printf("=== 1. Series solution: centre concentration and remaining drug ===\n");
    std::printf("  tau      c(0)/c0    m/m0 (series)   one-term (6/pi^2)e^(-pi^2 tau)\n");
    for (double tau : {0.01, 0.03, 0.05, 0.1, 0.2, 0.3})
        std::printf("  %5.2f    %.5f    %.5f        %.5f\n", tau, theta(0.0, tau), remainingFraction(tau),
                    6 / (PI * PI) * std::exp(-PI * PI * tau));

    std::printf("\n=== 2. Check against a finite-volume solution (200 shells) ===\n");
    for (double tau : {0.03, 0.1}) {
        auto fv = finiteVolume(tau);
        std::printf("  tau = %4.2f: centre FV = %.4f vs series %.4f; m/m0 FV = %.4f vs series %.4f\n",
                    tau, fv.first, theta(0.5 / 200, tau), fv.second, remainingFraction(tau));
    }

    std::printf("\n=== 3. Characteristic release times ===\n");
    double t50 = tauFor(0.5), t90 = tauFor(0.1);
    std::printf("  50%% released at tau = %.4f;  90%% released at tau = %.4f\n", t50, t90);
    std::printf("  short-time check: 6 sqrt(tau/pi) - 3 tau at tau_50 = %.4f (should be 0.5)\n",
                6 * std::sqrt(t50 / PI) - 3 * t50);

    std::printf("\n=== 4. Case: release from hydrogel beads (illustrative diffusivities) ===\n");
    const char* names[2] = {"small drug, D = 5e-10 m^2/s", "protein, D = 1e-11 m^2/s"};
    double Ds[2] = {5e-10, 1e-11};
    for (int k = 0; k < 2; ++k) {
        std::printf("  %s\n", names[k]);
        for (double Rmm : {0.1, 0.5, 1.0, 2.0}) {
            double R = Rmm * 1e-3;
            std::printf("    R = %3.1f mm: t50 = %8.2f min, t90 = %8.1f min\n", Rmm,
                        t50 * R * R / Ds[k] / 60, t90 * R * R / Ds[k] / 60);
        }
    }
    std::printf("  -> release time scales as R^2/D: halving the bead radius releases four times faster\n");
    return 0;
}
