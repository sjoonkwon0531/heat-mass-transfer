/* ============================================================
   Week1Codes.js
   Raw code samples for Wk01 — Intro to Heat & Mass Transfer
   - 4 topics: flux analogy (Pr/Sc/Le), random walk,
               unified transport equation, 3 heat-transfer modes
   - 4 languages: Python, MATLAB, Julia, C++
   These strings are imported by Week1App.jsx > RawCodes tab.
   All code uses minimal external dependencies.
   ============================================================ */

// ============================================================
// 1) FLUX ANALOGY — Newton / Fourier / Fick + Pr, Sc, Le
// ============================================================

export const PY_ANALOGY = `"""
Wk01 - Transport analogy: Newton / Fourier / Fick
All three diffusivities (nu, alpha, D) share units of m^2/s,
so their ratios form the dimensionless groups Pr, Sc, Le.

Run:    python wk01_flux_analogy.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt

# name: (mu [Pa s], k [W/m K], D [m^2/s], rho [kg/m^3], cp [J/kg K])
MATERIALS = {
    "Air (25C)":   (1.8e-5, 0.026, 2.5e-5, 1.18, 1005.0),
    "Water (25C)": (8.9e-4, 0.61,  2.0e-9, 997.0, 4180.0),
    "Glycerin":    (0.95,   0.29,  1.0e-11, 1260.0, 2430.0),
    "Engine oil":  (0.80,   0.145, 1.0e-10, 888.0, 1880.0),
}

print(f"{'Material':<14}{'nu':>11}{'alpha':>11}{'D':>11}"
      f"{'Pr':>9}{'Sc':>11}{'Le':>9}")
rows = []
for name, (mu, k, D, rho, cp) in MATERIALS.items():
    nu = mu / rho
    alpha = k / (rho * cp)
    Pr, Sc, Le = nu / alpha, nu / D, alpha / D
    rows.append((name, nu, alpha, D))
    print(f"{name:<14}{nu:11.2e}{alpha:11.2e}{D:11.2e}"
          f"{Pr:9.2f}{Sc:11.1f}{Le:9.1f}")

# --- bar chart of the three diffusivities (log scale) --------
names = [r[0] for r in rows]
x = np.arange(len(names)); w = 0.26
fig, ax = plt.subplots(figsize=(8, 4.5))
ax.bar(x - w, [r[1] for r in rows], w, label=r"$\\nu$ (momentum)")
ax.bar(x,     [r[2] for r in rows], w, label=r"$\\alpha$ (heat)")
ax.bar(x + w, [r[3] for r in rows], w, label=r"$D$ (mass)")
ax.set_yscale("log"); ax.set_ylabel(r"diffusivity [m$^2$/s]")
ax.set_xticks(x); ax.set_xticklabels(names, rotation=10)
ax.set_title("One unit (m^2/s), three transports")
ax.legend(); ax.grid(alpha=0.3, axis="y")
plt.tight_layout(); plt.show()
`;

export const ML_ANALOGY = `% Wk01 - Transport analogy: Newton / Fourier / Fick (Pr, Sc, Le)
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc;

names = {'Air (25C)','Water (25C)','Glycerin','Engine oil'};
mu  = [1.8e-5, 8.9e-4, 0.95,  0.80];
k   = [0.026,  0.61,   0.29,  0.145];
D   = [2.5e-5, 2.0e-9, 1e-11, 1e-10];
rho = [1.18,   997,    1260,  888];
cp  = [1005,   4180,   2430,  1880];

nu    = mu ./ rho;
alpha = k ./ (rho .* cp);
Pr = nu ./ alpha;  Sc = nu ./ D;  Le = alpha ./ D;

fprintf('%-14s %10s %10s %10s %8s %10s %8s\\n', ...
        'Material','nu','alpha','D','Pr','Sc','Le');
for i = 1:numel(names)
    fprintf('%-14s %10.2e %10.2e %10.2e %8.2f %10.1f %8.1f\\n', ...
        names{i}, nu(i), alpha(i), D(i), Pr(i), Sc(i), Le(i));
end

figure(1);
Y = [nu; alpha; D]';
b = bar(Y); set(gca,'YScale','log');
set(gca,'XTickLabel',names);
legend('\\nu (momentum)','\\alpha (heat)','D (mass)','Location','best');
ylabel('diffusivity [m^2/s]');
title('One unit (m^2/s), three transports'); grid on;
`;

export const JL_ANALOGY = `# Wk01 - Transport analogy: Newton / Fourier / Fick (Pr, Sc, Le)
# Run: julia wk01_flux_analogy.jl   (needs Plots, Printf)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Printf, Plots

names = ["Air (25C)", "Water (25C)", "Glycerin", "Engine oil"]
mu  = [1.8e-5, 8.9e-4, 0.95,  0.80]
k   = [0.026,  0.61,   0.29,  0.145]
D   = [2.5e-5, 2.0e-9, 1e-11, 1e-10]
rho = [1.18,   997.0,  1260.0, 888.0]
cp  = [1005.0, 4180.0, 2430.0, 1880.0]

nu    = mu ./ rho
alpha = k ./ (rho .* cp)
Pr = nu ./ alpha; Sc = nu ./ D; Le = alpha ./ D

@printf("%-14s %10s %10s %10s %8s %10s %8s\\n",
        "Material", "nu", "alpha", "D", "Pr", "Sc", "Le")
for i in eachindex(names)
    @printf("%-14s %10.2e %10.2e %10.2e %8.2f %10.1f %8.1f\\n",
            names[i], nu[i], alpha[i], D[i], Pr[i], Sc[i], Le[i])
end

x = 1:length(names)
plt = plot(yscale=:log10, ylabel="diffusivity [m^2/s]",
           title="One unit (m^2/s), three transports",
           xticks=(x, names), legend=:best)
bar!(plt, x .- 0.25, nu,    bar_width=0.22, label="nu (momentum)")
bar!(plt, x,         alpha, bar_width=0.22, label="alpha (heat)")
bar!(plt, x .+ 0.25, D,     bar_width=0.22, label="D (mass)")
display(plt); readline()
`;

export const CPP_ANALOGY = `// Wk01 - Transport analogy: Newton / Fourier / Fick (Pr, Sc, Le)
// Build: g++ -O2 -std=c++17 wk01_flux_analogy.cpp -o analogy && ./analogy
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <string>
#include <vector>

struct Mat { std::string name; double mu, k, D, rho, cp; };

int main() {
    std::vector<Mat> mats = {
        {"Air (25C)",   1.8e-5, 0.026, 2.5e-5, 1.18, 1005.0},
        {"Water (25C)", 8.9e-4, 0.61,  2.0e-9, 997.0, 4180.0},
        {"Glycerin",    0.95,   0.29,  1.0e-11, 1260.0, 2430.0},
        {"Engine oil",  0.80,   0.145, 1.0e-10, 888.0, 1880.0},
    };
    std::printf("%-14s %10s %10s %10s %8s %10s %8s\\n",
                "Material", "nu", "alpha", "D", "Pr", "Sc", "Le");
    for (const auto& m : mats) {
        double nu = m.mu / m.rho;
        double alpha = m.k / (m.rho * m.cp);
        double Pr = nu / alpha, Sc = nu / m.D, Le = alpha / m.D;
        std::printf("%-14s %10.2e %10.2e %10.2e %8.2f %10.1f %8.1f\\n",
                    m.name.c_str(), nu, alpha, m.D, Pr, Sc, Le);
    }
    std::puts("\\nAll diffusivities share m^2/s -> ratios are dimensionless.");
    return 0;
}
`;

// ============================================================
// 2) RANDOM WALK — molecular origin of diffusion
// ============================================================

export const PY_WALK = `"""
Wk01 - 1D random walk: microscopic randomness -> macroscopic diffusion
N particles hop +/-1 each step. The histogram converges to a Gaussian
with sigma = ell*sqrt(n), i.e. <x^2> = 2Dt with D = ell^2/(2 dt).

Run:    python wk01_random_walk.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng(1)
NP, NSTEP, ELL = 20000, 400, 1.0

pos = np.zeros(NP)
msd = np.zeros(NSTEP + 1)
for n in range(1, NSTEP + 1):
    pos += ELL * rng.choice([-1.0, 1.0], size=NP)
    msd[n] = np.mean(pos**2)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.2))

# --- histogram vs Gaussian ----------------------------------
sigma = ELL * np.sqrt(NSTEP)
xg = np.linspace(-4 * sigma, 4 * sigma, 400)
gauss = np.exp(-xg**2 / (2 * sigma**2)) / (sigma * np.sqrt(2 * np.pi))
ax1.hist(pos, bins=60, density=True, alpha=0.6, label="walkers")
ax1.plot(xg, gauss, "r-", lw=2, label="Gaussian, sigma = ell*sqrt(n)")
ax1.set_xlabel("x"); ax1.set_ylabel("P(x)")
ax1.set_title(f"{NP} walkers after {NSTEP} steps")
ax1.legend()

# --- MSD ~ t (the fingerprint of diffusion) -----------------
t = np.arange(NSTEP + 1)
ax2.plot(t, msd, "b-", lw=2, label="<x^2> (simulated)")
ax2.plot(t, ELL**2 * t, "r--", lw=2, label="theory: n*ell^2 = 2Dt")
ax2.set_xlabel("step n (time)"); ax2.set_ylabel("<x^2>")
ax2.set_title("Mean-square displacement grows linearly in t")
ax2.legend()
plt.tight_layout(); plt.show()
`;

export const ML_WALK = `% Wk01 - 1D random walk -> Gaussian diffusion
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc; rng(1);

NP = 20000; NSTEP = 400; ELL = 1.0;
pos = zeros(NP,1); msd = zeros(NSTEP+1,1);

for n = 1:NSTEP
    step = ELL * (2*(rand(NP,1) < 0.5) - 1);
    pos = pos + step;
    msd(n+1) = mean(pos.^2);
end

sigma = ELL * sqrt(NSTEP);
xg = linspace(-4*sigma, 4*sigma, 400);
gauss = exp(-xg.^2/(2*sigma^2)) / (sigma*sqrt(2*pi));

figure(1);
subplot(1,2,1);
histogram(pos, 60, 'Normalization','pdf'); hold on;
plot(xg, gauss, 'r-', 'LineWidth', 2); hold off;
xlabel('x'); ylabel('P(x)');
title(sprintf('%d walkers after %d steps', NP, NSTEP));
legend('walkers','Gaussian');

subplot(1,2,2);
t = 0:NSTEP;
plot(t, msd, 'b-', 'LineWidth', 2); hold on;
plot(t, ELL^2*t, 'r--', 'LineWidth', 2); hold off;
xlabel('step n (time)'); ylabel('<x^2>');
title('MSD grows linearly in t');
legend('simulated','theory: n \\cdot ell^2', 'Location','northwest');
`;

export const JL_WALK = `# Wk01 - 1D random walk -> Gaussian diffusion
# Run: julia wk01_random_walk.jl   (needs Plots)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Random, Statistics, Plots
Random.seed!(1)

NP, NSTEP, ELL = 20000, 400, 1.0
pos = zeros(NP)
msd = zeros(NSTEP + 1)

for n in 1:NSTEP
    pos .+= ELL .* (2 .* (rand(NP) .< 0.5) .- 1)
    msd[n+1] = mean(pos .^ 2)
end

sigma = ELL * sqrt(NSTEP)
xg = range(-4sigma, 4sigma, length=400)
gauss = exp.(-xg .^ 2 ./ (2sigma^2)) ./ (sigma * sqrt(2pi))

p1 = histogram(pos, bins=60, normalize=:pdf, alpha=0.6, label="walkers",
               xlabel="x", ylabel="P(x)", title="Walkers vs Gaussian")
plot!(p1, xg, gauss, lw=2, color=:red, label="Gaussian")

t = 0:NSTEP
p2 = plot(t, msd, lw=2, label="simulated",
          xlabel="step n (time)", ylabel="<x^2>", title="MSD ~ t")
plot!(p2, t, ELL^2 .* t, lw=2, ls=:dash, color=:red, label="theory")

display(plot(p1, p2, layout=(1,2), size=(950,420))); readline()
`;

export const CPP_WALK = `// Wk01 - 1D random walk -> Gaussian diffusion (CSV output)
// Build: g++ -O2 -std=c++17 wk01_random_walk.cpp -o walk && ./walk
// Output: walk_hist.csv (x, count), walk_msd.csv (n, msd)
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <random>
#include <vector>
#include <cmath>

int main() {
    const int NP = 20000, NSTEP = 400;
    std::mt19937 rng(1);
    std::bernoulli_distribution coin(0.5);

    std::vector<double> pos(NP, 0.0), msd(NSTEP + 1, 0.0);
    for (int n = 1; n <= NSTEP; ++n) {
        double s2 = 0.0;
        for (int i = 0; i < NP; ++i) {
            pos[i] += coin(rng) ? 1.0 : -1.0;
            s2 += pos[i] * pos[i];
        }
        msd[n] = s2 / NP;
    }

    // histogram
    const int NB = 61; const double XMAX = 4.0 * std::sqrt((double)NSTEP);
    std::vector<int> hist(NB, 0);
    for (int i = 0; i < NP; ++i) {
        int b = (int)((pos[i] + XMAX) / (2 * XMAX) * NB);
        if (b >= 0 && b < NB) hist[b]++;
    }
    FILE* f1 = std::fopen("walk_hist.csv", "w");
    std::fprintf(f1, "x,count\\n");
    for (int b = 0; b < NB; ++b) {
        double x = -XMAX + (b + 0.5) * 2 * XMAX / NB;
        std::fprintf(f1, "%.3f,%d\\n", x, hist[b]);
    }
    std::fclose(f1);

    FILE* f2 = std::fopen("walk_msd.csv", "w");
    std::fprintf(f2, "n,msd,theory\\n");
    for (int n = 0; n <= NSTEP; ++n)
        std::fprintf(f2, "%d,%.4f,%d\\n", n, msd[n], n);
    std::fclose(f2);

    std::printf("Done. sigma(sim) = %.2f, theory = %.2f\\n",
                std::sqrt(msd[NSTEP]), std::sqrt((double)NSTEP));
    return 0;
}
`;

// ============================================================
// 3) UNIFIED TRANSPORT EQUATION — one solver, three physics
// ============================================================

export const PY_UNIFIED = `"""
Wk01 - One equation, three physics:
    d(phi)/dt = delta * d2(phi)/dx2,  phi(0,t)=1, phi(inf,t)=0
The SAME solver is called three times with delta = nu, alpha, D.
FDM result is compared to the analytic solution
    phi = erfc( x / (2*sqrt(delta*t)) ).

Run:    python wk01_unified_transport.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt
from math import erfc

# --- one generic diffusion solver (explicit FDM) -------------
def solve_diffusion(delta, L=1.0, N=201, t_end=0.005):
    x = np.linspace(0.0, L, N); dx = x[1] - x[0]
    dt = 0.4 * dx * dx / delta
    nstep = int(t_end / dt) + 1
    dt = t_end / nstep
    phi = np.zeros(N); phi[0] = 1.0
    c = delta * dt / dx**2
    for _ in range(nstep):
        phi[1:-1] += c * (phi[2:] - 2 * phi[1:-1] + phi[:-2])
        phi[0], phi[-1] = 1.0, 0.0
    return x, phi

# --- water at 25 C: three very different diffusivities -------
water = {"momentum (nu)": 8.9e-7,
         "heat (alpha)":  1.43e-7,
         "mass (D)":      2.0e-9}
t_end = 20.0  # seconds
colors = {"momentum (nu)": "tab:blue",
          "heat (alpha)":  "tab:red",
          "mass (D)":      "tab:green"}

plt.figure(figsize=(8, 5))
for name, delta in water.items():
    x, phi = solve_diffusion(delta, L=0.02, N=201, t_end=t_end)
    plt.plot(x * 1000, phi, "-", color=colors[name], lw=2,
             label=f"{name}: FDM")
    ana = np.array([erfc(xi / (2 * np.sqrt(delta * t_end))) for xi in x])
    plt.plot(x * 1000, ana, "--", color=colors[name], lw=1.2,
             label=f"{name}: analytic erfc")

Pr = water["momentum (nu)"] / water["heat (alpha)"]
Sc = water["momentum (nu)"] / water["mass (D)"]
plt.title(f"Water, t = {t_end:.0f} s  (Pr = {Pr:.1f}, Sc = {Sc:.0f})"
          "\\nSame equation & same solver - only delta differs")
plt.xlabel("distance from wall x [mm]")
plt.ylabel("phi (v*, T*, C*)")
plt.legend(fontsize=8); plt.grid(alpha=0.3)
plt.tight_layout(); plt.show()
`;

export const ML_UNIFIED = `% Wk01 - One equation, three physics (nu, alpha, D)
% d(phi)/dt = delta d2(phi)/dx2, phi(0)=1 -> compare with erfc analytic
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc;

deltas = [8.9e-7, 1.43e-7, 2.0e-9];      % water: nu, alpha, D
labels = {'momentum (nu)','heat (alpha)','mass (D)'};
cols   = {'b','r','g'};
L = 0.02; N = 201; t_end = 20.0;

figure(1); hold on;
for m = 1:3
    delta = deltas(m);
    x = linspace(0, L, N); dx = x(2) - x(1);
    dt = 0.4*dx^2/delta; nstep = ceil(t_end/dt); dt = t_end/nstep;
    phi = zeros(1, N); phi(1) = 1;
    c = delta*dt/dx^2;
    for n = 1:nstep
        phi(2:end-1) = phi(2:end-1) + ...
            c*(phi(3:end) - 2*phi(2:end-1) + phi(1:end-2));
        phi(1) = 1; phi(end) = 0;
    end
    plot(x*1000, phi, [cols{m} '-'], 'LineWidth', 2, ...
         'DisplayName', [labels{m} ' FDM']);
    ana = erfc(x / (2*sqrt(delta*t_end)));
    plot(x*1000, ana, [cols{m} '--'], 'LineWidth', 1, ...
         'DisplayName', [labels{m} ' analytic']);
end
hold off; grid on;
xlabel('x [mm]'); ylabel('phi (v*, T*, C*)');
Pr = deltas(1)/deltas(2); Sc = deltas(1)/deltas(3);
title(sprintf('Water, t = %.0f s (Pr = %.1f, Sc = %.0f)', t_end, Pr, Sc));
legend('Location','northeast');
`;

export const JL_UNIFIED = `# Wk01 - One equation, three physics (nu, alpha, D vs erfc analytic)
# Run: julia wk01_unified_transport.jl   (needs Plots, SpecialFunctions)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Plots, SpecialFunctions, Printf

function solve_diffusion(delta; L=0.02, N=201, t_end=20.0)
    x = range(0, L, length=N); dx = step(x)
    dt = 0.4 * dx^2 / delta
    nstep = ceil(Int, t_end / dt); dt = t_end / nstep
    phi = zeros(N); phi[1] = 1.0
    c = delta * dt / dx^2
    for _ in 1:nstep
        phi[2:end-1] .+= c .* (phi[3:end] .- 2 .* phi[2:end-1] .+ phi[1:end-2])
        phi[1] = 1.0; phi[end] = 0.0
    end
    return collect(x), phi
end

deltas = [8.9e-7, 1.43e-7, 2.0e-9]      # water: nu, alpha, D
labels = ["momentum (nu)", "heat (alpha)", "mass (D)"]
cols   = [:blue, :red, :green]
t_end  = 20.0

plt = plot(xlabel="x [mm]", ylabel="phi (v*, T*, C*)",
           title="Water: same solver, three diffusivities", legend=:topright)
for m in 1:3
    x, phi = solve_diffusion(deltas[m]; t_end=t_end)
    plot!(plt, x .* 1000, phi, lw=2, color=cols[m], label=labels[m] * " FDM")
    ana = erfc.(x ./ (2 .* sqrt(deltas[m] * t_end)))
    plot!(plt, x .* 1000, ana, lw=1, ls=:dash, color=cols[m],
          label=labels[m] * " analytic")
end
@printf("Pr = %.1f, Sc = %.0f\\n", deltas[1]/deltas[2], deltas[1]/deltas[3])
display(plt); readline()
`;

export const CPP_UNIFIED = `// Wk01 - One equation, three physics (CSV output + erfc check)
// Build: g++ -O2 -std=c++17 wk01_unified_transport.cpp -o unified && ./unified
// Output: unified_profiles.csv (x, v, T, C, and analytic columns)
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <cmath>
#include <vector>

std::vector<double> solve_diffusion(double delta, double L, int N, double t_end) {
    std::vector<double> phi(N, 0.0);
    phi[0] = 1.0;
    double dx = L / (N - 1);
    double dt = 0.4 * dx * dx / delta;
    int nstep = (int)std::ceil(t_end / dt);
    dt = t_end / nstep;
    double c = delta * dt / (dx * dx);
    std::vector<double> nw(N);
    for (int n = 0; n < nstep; ++n) {
        nw = phi;
        for (int i = 1; i < N - 1; ++i)
            nw[i] = phi[i] + c * (phi[i + 1] - 2 * phi[i] + phi[i - 1]);
        nw[0] = 1.0; nw[N - 1] = 0.0;
        phi.swap(nw);
    }
    return phi;
}

int main() {
    const double L = 0.02, T_END = 20.0;
    const int N = 201;
    const double nu = 8.9e-7, alpha = 1.43e-7, D = 2.0e-9;  // water

    auto v = solve_diffusion(nu, L, N, T_END);
    auto T = solve_diffusion(alpha, L, N, T_END);
    auto Cc = solve_diffusion(D, L, N, T_END);

    FILE* f = std::fopen("unified_profiles.csv", "w");
    std::fprintf(f, "x_mm,v_fdm,T_fdm,C_fdm,v_ana,T_ana,C_ana\\n");
    for (int i = 0; i < N; ++i) {
        double x = L * i / (N - 1);
        std::fprintf(f, "%.4f,%.5f,%.5f,%.5f,%.5f,%.5f,%.5f\\n",
            x * 1000, v[i], T[i], Cc[i],
            std::erfc(x / (2 * std::sqrt(nu * T_END))),
            std::erfc(x / (2 * std::sqrt(alpha * T_END))),
            std::erfc(x / (2 * std::sqrt(D * T_END))));
    }
    std::fclose(f);
    std::printf("Water: Pr = %.1f, Sc = %.0f, Le = %.0f\\n",
                nu / alpha, nu / D, alpha / D);
    std::puts("Wrote unified_profiles.csv");
    return 0;
}
`;

// ============================================================
// 4) THREE MODES OF HEAT TRANSFER
// ============================================================

export const PY_MODES = `"""
Wk01 - Conduction vs convection vs radiation
Sweeps the hot-surface temperature and shows the T^4 takeover
of radiation at high temperature.

Run:    python wk01_heat_modes.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt

SIGMA = 5.670e-8      # Stefan-Boltzmann [W/m^2 K^4]
T_inf = 25.0          # ambient [C]
k, L = 0.6, 0.02      # slab conduction [W/m K], [m]
h = 25.0              # convection coefficient [W/m^2 K]
eps = 0.85            # emissivity

Ts = np.linspace(30.0, 900.0, 400)          # hot surface [C]
dT = Ts - T_inf
q_cond = k * dT / L
q_conv = h * dT
q_rad = eps * SIGMA * ((Ts + 273.15)**4 - (T_inf + 273.15)**4)

plt.figure(figsize=(8, 5))
plt.plot(Ts, q_cond / 1e3, lw=2, label="conduction  q = k dT/L")
plt.plot(Ts, q_conv / 1e3, lw=2, label="convection  q = h dT")
plt.plot(Ts, q_rad / 1e3, lw=2, label="radiation    q = eps*sigma*(Ts^4-Tinf^4)")
xc = Ts[np.argmin(np.abs(q_rad - q_conv))]
plt.axvline(xc, color="gray", ls=":", lw=1)
plt.text(xc + 8, 2, f"radiation passes convection\\n near {xc:.0f} C", fontsize=9)
plt.xlabel("hot-surface temperature Ts [C]")
plt.ylabel("heat flux q'' [kW/m^2]")
plt.title("Three modes of heat transfer: who dominates when?")
plt.legend(); plt.grid(alpha=0.3)
plt.tight_layout(); plt.show()
`;

export const ML_MODES = `% Wk01 - Conduction vs convection vs radiation (T^4 takeover)
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc;

SIGMA = 5.670e-8; T_inf = 25;
k = 0.6; L = 0.02; h = 25; eps = 0.85;

Ts = linspace(30, 900, 400);
dT = Ts - T_inf;
q_cond = k * dT / L;
q_conv = h * dT;
q_rad  = eps * SIGMA * ((Ts+273.15).^4 - (T_inf+273.15)^4);

figure(1);
plot(Ts, q_cond/1e3, 'LineWidth', 2); hold on;
plot(Ts, q_conv/1e3, 'LineWidth', 2);
plot(Ts, q_rad/1e3,  'LineWidth', 2); hold off;
grid on;
xlabel('hot-surface temperature T_s [C]');
ylabel('heat flux q'''' [kW/m^2]');
title('Three modes of heat transfer: who dominates when?');
legend('conduction k\\DeltaT/L','convection h\\DeltaT', ...
       'radiation \\epsilon\\sigma(T_s^4-T_\\infty^4)', ...
       'Location','northwest');

[~, ic] = min(abs(q_rad - q_conv));
fprintf('Radiation passes convection near Ts = %.0f C\\n', Ts(ic));
`;

export const JL_MODES = `# Wk01 - Conduction vs convection vs radiation (T^4 takeover)
# Run: julia wk01_heat_modes.jl   (needs Plots)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Plots, Printf

const SIGMA = 5.670e-8
T_inf = 25.0
k, L, h, eps_ = 0.6, 0.02, 25.0, 0.85

Ts = range(30.0, 900.0, length=400)
dT = Ts .- T_inf
q_cond = k .* dT ./ L
q_conv = h .* dT
q_rad  = eps_ .* SIGMA .* ((Ts .+ 273.15).^4 .- (T_inf + 273.15)^4)

plt = plot(xlabel="hot-surface temperature Ts [C]",
           ylabel="heat flux q'' [kW/m^2]",
           title="Three modes: who dominates when?", legend=:topleft)
plot!(plt, Ts, q_cond ./ 1e3, lw=2, label="conduction k*dT/L")
plot!(plt, Ts, q_conv ./ 1e3, lw=2, label="convection h*dT")
plot!(plt, Ts, q_rad ./ 1e3,  lw=2, label="radiation eps*sigma*(Ts^4-Tinf^4)")

ic = argmin(abs.(q_rad .- q_conv))
@printf("Radiation passes convection near Ts = %.0f C\\n", Ts[ic])
display(plt); readline()
`;

export const CPP_MODES = `// Wk01 - Conduction vs convection vs radiation (CSV output)
// Build: g++ -O2 -std=c++17 wk01_heat_modes.cpp -o modes && ./modes
// Output: heat_modes.csv (Ts, q_cond, q_conv, q_rad in W/m^2)
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <cmath>

int main() {
    const double SIGMA = 5.670e-8, T_INF = 25.0;
    const double K = 0.6, L = 0.02, H = 25.0, EPS = 0.85;

    FILE* f = std::fopen("heat_modes.csv", "w");
    std::fprintf(f, "Ts_C,q_cond,q_conv,q_rad\\n");
    double cross = -1.0, prev = -1.0;
    for (int i = 0; i <= 400; ++i) {
        double Ts = 30.0 + (900.0 - 30.0) * i / 400.0;
        double dT = Ts - T_INF;
        double qc = K * dT / L;
        double qv = H * dT;
        double qr = EPS * SIGMA *
            (std::pow(Ts + 273.15, 4) - std::pow(T_INF + 273.15, 4));
        std::fprintf(f, "%.1f,%.1f,%.1f,%.1f\\n", Ts, qc, qv, qr);
        double d = qr - qv;
        if (prev < 0 && d >= 0 && cross < 0) cross = Ts;
        prev = d;
    }
    std::fclose(f);
    std::printf("Radiation passes convection near Ts = %.0f C\\n", cross);
    std::puts("Wrote heat_modes.csv");
    return 0;
}
`;
