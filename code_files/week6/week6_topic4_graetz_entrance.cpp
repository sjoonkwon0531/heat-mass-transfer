// Week 6 - Topic 4: The Graetz Problem - Eigenvalues, Entrance Region, Nu_inf
// Sturm-Liouville: (1/eta) d/deta(eta dPhi/deta) = -lam^2 (1-eta^2) Phi,
//   Phi'(0) = 0, Phi(1) = 0 -> lam_1 = 2.7044, ...; Nu_inf = lam_1^2/2 = 3.656
// Leveque entrance: Nu = 1.357 (R/z)^(1/3) Pe^(1/3); L_T/R ~ 0.1 Pe.
// Compile: g++ -O2 -std=c++17 week6_topic4_graetz_entrance.cpp -o topic4 && ./topic4

#include <cmath>
#include <cstdio>
#include <vector>
#include <cassert>
#include <initializer_list>

double phiAtWall(double lam, int n = 4000) {
    double h = 1.0 / n, eta = 1e-6;
    double Phi = 1.0 - lam * lam * eta * eta / 4.0;
    double dPhi = -lam * lam * eta / 2.0;
    auto f1 = [&](double e, double P, double D) { return D; };
    auto f2 = [&](double e, double P, double D) {
        return -lam * lam * (1.0 - e * e) * P - D / e;
    };
    while (eta < 1.0 - 1e-12) {
        double s = std::fmin(h, 1.0 - eta);
        double k1P = f1(eta, Phi, dPhi),          k1D = f2(eta, Phi, dPhi);
        double k2P = f1(eta + s/2, Phi + s/2*k1P, dPhi + s/2*k1D),
               k2D = f2(eta + s/2, Phi + s/2*k1P, dPhi + s/2*k1D);
        double k3P = f1(eta + s/2, Phi + s/2*k2P, dPhi + s/2*k2D),
               k3D = f2(eta + s/2, Phi + s/2*k2P, dPhi + s/2*k2D);
        double k4P = f1(eta + s, Phi + s*k3P, dPhi + s*k3D),
               k4D = f2(eta + s, Phi + s*k3P, dPhi + s*k3D);
        Phi  += s / 6 * (k1P + 2*k2P + 2*k3P + k4P);
        dPhi += s / 6 * (k1D + 2*k2D + 2*k3D + k4D);
        eta += s;
    }
    return Phi;
}

std::vector<double> graetzEigenvalues(int count = 5) {
    std::vector<double> eigs;
    double prevL = 0.5, prevF = phiAtWall(0.5);
    for (double lam = 0.6; (int)eigs.size() < count; lam += 0.1) {
        double f = phiAtWall(lam);
        if (prevF * f < 0) {
            double lo = prevL, hi = lam, flo = prevF;
            for (int i = 0; i < 60; ++i) {
                double mid = 0.5 * (lo + hi), fm = phiAtWall(mid);
                if (flo * fm <= 0) hi = mid;
                else { lo = mid; flo = fm; }
            }
            eigs.push_back(0.5 * (lo + hi));
        }
        prevL = lam; prevF = f;
    }
    return eigs;
}

double nuLeveque(double zOverR, double Pe) {
    return 1.357 * std::cbrt(1.0 / zOverR) * std::cbrt(Pe);
}

int main() {
    auto eigs = graetzEigenvalues(5);
    std::printf("Graetz eigenvalues (shooting + bisection):\n  computed :");
    for (double e : eigs) std::printf(" %8.4f", e);
    std::printf("\n  lecture  :   2.7044   6.6790  10.6730  14.6710  18.6700\n");
    double nuInf = eigs[0] * eigs[0] / 2.0;
    std::printf("\n  Nu_inf = lam_1^2/2 = %.3f (lecture: 3.656)\n", nuInf);
    std::printf("  (Week 5 used the engineering value 3.660 - same physics.)\n");

    double C = 6.0 / (std::tgamma(1.0 / 3.0) * std::cbrt(9.0 / 2.0));
    std::printf("\nLeveque constant: 6/[Gamma(1/3)(9/2)^(1/3)] = %.4f (lecture 1.357)\n", C);
    std::printf("  Gamma(1/3) = %.5f\n", std::tgamma(1.0 / 3.0));

    double Pe = 1000.0;
    std::printf("\nEntrance region, Pe = %.0f:\n  z/R        Nu_Leveque\n", Pe);
    for (double zR : {0.1, 1.0, 10.0, 100.0})
        std::printf("  %8.1f  %10.2f\n", zR, nuLeveque(zR, Pe));
    std::printf("  thermal entrance length: L_T/R ~ 0.1 Pe = %.0f\n", 0.1 * Pe);
    double slope = (std::log(nuLeveque(10, Pe)) - std::log(nuLeveque(1, Pe))) / std::log(10.0);
    std::printf("  log-log slope = %.4f (= -1/3)\n", slope);

    assert(std::fabs(eigs[0] - 2.7044) < 2e-3);
    assert(std::fabs(nuInf - 3.656) < 5e-3);
    assert(std::fabs(slope + 1.0 / 3.0) < 1e-9);
    return 0;
}
