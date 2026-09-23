// Week 4 - Topic 4: Explicit FDM in Matrix Form - U_{n+1} = D*U_n + dtau*q_n
// dU/dtau = d^2U/dr^2 + q(r,tau), U(0)=U(1)=0, U(r,0)=0
// Lecture demo: dr = 0.01, dtau = dr^2/4 (s = 1/4), q = 100 on [0.45, 0.55],
// tau <= 0.1, T0 = 25 degC -> U_max = 1.7786, T_max = T0*U_max = 44.46 degC
// Compile: g++ -O2 -std=c++17 week4_topic4_fdm_matrix.cpp -o topic4 && ./topic4

#include <cmath>
#include <cstdio>
#include <vector>
#include <cassert>

struct Result { std::vector<double> r, U; double Umax; };

Result runFDM(double delr = 0.01, double s = 0.25, double tauEnd = 0.1,
              double q0 = 100.0, double b0 = 0.45, double b1 = 0.55,
              double eta = 0.0) {
    double delt = s * delr * delr;
    int m = static_cast<int>(std::lround(1.0 / delr));      // nodes 0..m
    int nsteps = static_cast<int>(std::lround(tauEnd / delt));
    std::vector<double> r(m + 1), q(m + 1, 0.0), U(m + 1, 0.0), Un(m + 1);
    for (int i = 0; i <= m; ++i) {
        r[i] = i * delr;
        if (r[i] >= b0 - 1e-12 && r[i] <= b1 + 1e-12) q[i] = q0;
    }
    // The tridiagonal product D*U is applied row by row (same matrix as the lecture).
    double Umax = 0.0, tau = 0.0;
    for (int kstep = 0; kstep < nsteps; ++kstep) {
        double decay = eta > 0.0 ? std::exp(-eta * tau) : 1.0;
        for (int i = 0; i <= m; ++i) {
            double left  = i > 0 ? U[i - 1] : 0.0;   // outside the wall U = 0 (BC)
            double right = i < m ? U[i + 1] : 0.0;
            Un[i] = (1.0 - 2.0 * s) * U[i] + s * (left + right) + delt * q[i] * decay;
        }
        U.swap(Un);
        tau += delt;
        for (double u : U) Umax = std::fmax(Umax, u);
    }
    return {r, U, Umax};
}

int main() {
    // --- Lecture demo ---
    Result res = runFDM();
    double T0 = 25.0;
    std::printf("Lecture demo: dr = 0.01, dtau = dr^2/4, q = 100 on [0.45, 0.55]\n");
    std::printf("  U_max = %.4f\n", res.Umax);
    std::printf("  T_max = T0 * U_max = %.2f degC   (lecture: 44.46 degC)\n", T0 * res.Umax);
    int m = static_cast<int>(res.U.size()) - 1;
    std::printf("  final profile: U(0.25) = %.4f,  U(0.5) = %.4f,  U(0.75) = %.4f\n",
                res.U[m / 4], res.U[m / 2], res.U[3 * m / 4]);

    // --- Decaying source ---
    Result resd = runFDM(0.01, 0.25, 0.1, 100.0, 0.45, 0.55, 1.0);
    std::printf("\nDecaying source q*exp(-tau): U_max = %.4f (T_max = %.2f degC)\n",
                resd.Umax, T0 * resd.Umax);

    // --- Stability experiment ---
    std::printf("\nStability of the explicit scheme (s = dtau/dr^2):\n");
    for (double s : {0.25, 0.50, 0.51, 0.60}) {
        Result rr = runFDM(0.02, s, 0.1);
        double mx = 0.0;
        bool finite = true;
        for (double u : rr.U) { mx = std::fmax(mx, std::fabs(u)); finite &= std::isfinite(u); }
        std::printf("  s = %4.2f: max|U| at tau=0.1 -> %10.3e  %s\n", s, mx,
                    (finite && mx < 10.0) ? "stable" : "UNSTABLE");
    }
    std::printf("  -> s <= 1/2: node moves toward neighbors' mean; beyond, it overshoots.\n");

    // sanity: symmetric problem -> symmetric field
    for (int i = 0; i <= m; ++i)
        assert(std::fabs(res.U[i] - res.U[m - i]) < 1e-12);
    return 0;
}
