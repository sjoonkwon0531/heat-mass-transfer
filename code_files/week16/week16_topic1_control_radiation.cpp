// Week 16 · Topic 1 — Final review: stirred-tank dynamics, FOPDT/PI tuning, gray-body radiation
// Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
//   tau = rho V/mdot, K = 1/(mdot cp);  tau_p = 1.5 (t2 - t1), theta_p = (3 t1 - t2)/2
//   ITAE PI (lecture): Kc Kp = 0.859 (theta/tau)^-0.977, tau_I = (tau/0.674)(theta/tau)^0.680
//   parallel plates with N thin shields: q'' = sigma (T1^4 - T2^4) / sum of (1/e_i + 1/e_j - 1)
#include <cmath>
#include <cstdio>
#include <initializer_list>
#include <string>
#include <vector>

const double SIGMA = 5.670e-8;

int main() {
    std::printf("Topic 1 — stirred tank, FOPDT/PI tuning, gray-body radiation\n\n");
    double V = 0.5, mdot = 0.25, cp = 4184.0, dQ = 1.0e4;
    double tau = 1000.0 * V / mdot, K = 1.0 / (mdot * cp);
    std::printf("[1] Stirred tank: V = 0.5 m3, mdot = 0.25 kg/s, cp = 4184 J/kg K, dQ = 10 kW\n");
    std::printf("   tau = %.0f s, K = %.3e K/W, final rise = %.2f K, t95 = 3 tau = %.0f s\n", tau, K, K * dQ, 3 * tau);
    for (double frac : {0.632, 0.95}) std::printf("   time to %.1f%% = %.0f s\n", 100 * frac, -tau * std::log(1 - frac));
    std::printf("\n");
    double t1 = 20.0, t2 = 50.0, tp = 1.5 * (t2 - t1), th = (3 * t1 - t2) / 2, r = th / tp;
    std::printf("[2] FOPDT two-point fit: t1 = 20 s (28.3%%), t2 = 50 s (63.2%%)\n");
    std::printf("   tau_p = %.1f s, theta_p = %.1f s, theta/tau = %.4f\n", tp, th, r);
    std::printf("   ITAE PI: Kc Kp = %.3f, tau_I = %.2f s\n", 0.859 * std::pow(r, -0.977), tp / 0.674 * std::pow(r, 0.680));
    std::printf("\n");
    std::printf("[3] Parallel plates T1 = 800 K (e = 0.6), T2 = 400 K (e = 0.9), shields e = 0.05\n");
    double q0 = -1;
    for (int n = 0; n < 4; ++n) {
        std::vector<double> eps;
        eps.push_back(0.6);
        for (int i = 0; i < n; ++i) eps.push_back(0.05);
        eps.push_back(0.9);
        std::vector<double> R;
        double sum = 0;
        for (int i = 0; i <= n; ++i) { R.push_back(1 / eps[i] + 1 / eps[i + 1] - 1); sum += R.back(); }
        double q = SIGMA * (std::pow(800.0, 4) - std::pow(400.0, 4)) / sum;
        if (q0 < 0) q0 = q;
        std::string ts;
        double T4 = std::pow(800.0, 4);
        char buf[32];
        for (int i = 0; i < n; ++i) {
            T4 -= q * R[i] / SIGMA;
            std::snprintf(buf, sizeof buf, "%s%.1f", i ? ", " : "", std::pow(T4, 0.25));
            ts += buf;
        }
        if (n == 0) ts = "-";
        std::printf("   N = %d: q'' = %9.1f W/m2  (q0/q = %6.2f)  shield T = %s K\n", n, q, q0 / q, ts.c_str());
    }
    std::printf("\n");
    double e = 0.8, D = 0.1, Ts = 450.0, Tsur = 300.0;
    double qp = e * SIGMA * M_PI * D * (std::pow(Ts, 4) - std::pow(Tsur, 4));
    double hr = e * SIGMA * (Ts + Tsur) * (Ts * Ts + Tsur * Tsur);
    std::printf("[4] Pipe in a room: D = 0.1 m, e = 0.8, 450 K in 300 K surroundings\n");
    std::printf("   q = %.1f W per metre, h_r = %.2f W/m2 K\n", qp, hr);
    std::printf("\n");
    std::printf("[5] Wien peaks (lambda_max T = 2898 um K)\n");
    for (double T : {5800.0, 2900.0, 300.0}) std::printf("   T = %6.0f K -> lambda_max = %.3f um\n", T, 2898.0 / T);
    return 0;
}
