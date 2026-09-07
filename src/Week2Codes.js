/* ============================================================
   Week2Codes.js
   Raw code samples for Wk02 — Physics of Heat Conduction
   - 4 topics: Drude Monte-Carlo, phonon dispersion (diatomic
               chain), Wiedemann-Franz check, Planck -> Stefan-
               Boltzmann integration
   - 4 languages: Python, MATLAB, Julia, C++
   Imported by Week2App.jsx > RawCodes tab.
   ============================================================ */

// ============================================================
// 1) DRUDE MONTE-CARLO — drift velocity from random scattering
// ============================================================

export const PY_DRUDE = `"""
Wk02 - Drude model Monte-Carlo (1D)
Electrons accelerate in a field (a = qE/m) and scatter with
probability dt/tau per step (velocity re-randomized).
The ensemble-average velocity converges to v_d = a*tau,
reproducing sigma = n q^2 tau / m.

Run:    python wk02_drude_mc.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng(2)
NE, NSTEP, DT = 5000, 3000, 0.01
TAU, A, U0 = 1.0, 0.5, 3.0     # mean free time, accel qE/m, thermal speed

v = U0 * rng.standard_normal(NE)      # random thermal start
vd_hist = np.zeros(NSTEP)
for n in range(NSTEP):
    scatter = rng.random(NE) < DT / TAU
    v[scatter] = U0 * rng.standard_normal(scatter.sum())  # thermalize
    v[~scatter] += A * DT                                  # field drift
    vd_hist[n] = v.mean()

t = np.arange(NSTEP) * DT
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.2))
ax1.plot(t, vd_hist, lw=1, label="<v> (simulation)")
ax1.axhline(A * TAU, color="r", ls="--", lw=2,
            label="Drude: v_d = a*tau")
ax1.set_xlabel("time"); ax1.set_ylabel("mean velocity")
ax1.set_title("Drift velocity emerges from chaos")
ax1.legend()

ax2.hist(v, bins=60, density=True, alpha=0.7)
ax2.axvline(A * TAU, color="r", ls="--", lw=2)
ax2.set_xlabel("v"); ax2.set_ylabel("P(v)")
ax2.set_title("Velocity distribution (shifted Maxwellian)")
plt.tight_layout(); plt.show()

print(f"simulated v_d = {vd_hist[NSTEP//2:].mean():.4f}")
print(f"Drude    v_d = {A*TAU:.4f}   (sigma = n q^2 tau / m)")
`;

export const ML_DRUDE = `% Wk02 - Drude model Monte-Carlo (1D)
% v_d converges to a*tau  ->  sigma = n q^2 tau / m
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc; rng(2);

NE = 5000; NSTEP = 3000; DT = 0.01;
TAU = 1.0; A = 0.5; U0 = 3.0;

v = U0 * randn(NE,1);
vd = zeros(NSTEP,1);
for n = 1:NSTEP
    sc = rand(NE,1) < DT/TAU;
    v(sc) = U0 * randn(sum(sc),1);
    v(~sc) = v(~sc) + A*DT;
    vd(n) = mean(v);
end

t = (0:NSTEP-1)*DT;
figure(1);
subplot(1,2,1);
plot(t, vd, 'b-'); hold on;
yline(A*TAU, 'r--', 'LineWidth', 2); hold off;
xlabel('time'); ylabel('<v>');
title('Drift velocity emerges from chaos');
legend('simulation','Drude a\\tau','Location','southeast');

subplot(1,2,2);
histogram(v, 60, 'Normalization','pdf'); hold on;
xline(A*TAU, 'r--', 'LineWidth', 2); hold off;
xlabel('v'); ylabel('P(v)'); title('Shifted Maxwellian');

fprintf('simulated v_d = %.4f, Drude a*tau = %.4f\\n', ...
        mean(vd(end/2:end)), A*TAU);
`;

export const JL_DRUDE = `# Wk02 - Drude model Monte-Carlo (1D)
# Run: julia wk02_drude_mc.jl   (needs Plots)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Random, Statistics, Plots, Printf
Random.seed!(2)

NE, NSTEP, DT = 5000, 3000, 0.01
TAU, A, U0 = 1.0, 0.5, 3.0

v = U0 .* randn(NE)
vd = zeros(NSTEP)
for n in 1:NSTEP
    for i in 1:NE
        if rand() < DT / TAU
            v[i] = U0 * randn()      # scatter: thermalize
        else
            v[i] += A * DT           # accelerate in field
        end
    end
    vd[n] = mean(v)
end

t = (0:NSTEP-1) .* DT
p1 = plot(t, vd, lw=1, label="<v> (simulation)",
          xlabel="time", ylabel="mean velocity",
          title="Drift velocity from chaos")
hline!(p1, [A * TAU], lw=2, ls=:dash, color=:red, label="Drude a*tau")

p2 = histogram(v, bins=60, normalize=:pdf, alpha=0.7, legend=false,
               xlabel="v", ylabel="P(v)", title="Shifted Maxwellian")
vline!(p2, [A * TAU], lw=2, ls=:dash, color=:red)

@printf("simulated v_d = %.4f, Drude a*tau = %.4f\\n",
        mean(vd[div(NSTEP,2):end]), A * TAU)
display(plot(p1, p2, layout=(1,2), size=(950,420))); readline()
`;

export const CPP_DRUDE = `// Wk02 - Drude model Monte-Carlo (1D, CSV output)
// Build: g++ -O2 -std=c++17 wk02_drude_mc.cpp -o drude && ./drude
// Output: drude_vd.csv (t, mean_v, theory)
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <random>
#include <vector>

int main() {
    const int NE = 5000, NSTEP = 3000;
    const double DT = 0.01, TAU = 1.0, A = 0.5, U0 = 3.0;
    std::mt19937 rng(2);
    std::normal_distribution<double> gauss(0.0, U0);
    std::uniform_real_distribution<double> uni(0.0, 1.0);

    std::vector<double> v(NE);
    for (auto& x : v) x = gauss(rng);

    FILE* f = std::fopen("drude_vd.csv", "w");
    std::fprintf(f, "t,mean_v,theory\\n");
    double vd_late = 0.0; int nlate = 0;
    for (int n = 0; n < NSTEP; ++n) {
        double s = 0.0;
        for (int i = 0; i < NE; ++i) {
            if (uni(rng) < DT / TAU) v[i] = gauss(rng);
            else                     v[i] += A * DT;
            s += v[i];
        }
        double vd = s / NE;
        if (n >= NSTEP / 2) { vd_late += vd; nlate++; }
        if (n % 10 == 0)
            std::fprintf(f, "%.2f,%.5f,%.5f\\n", n * DT, vd, A * TAU);
    }
    std::fclose(f);
    std::printf("simulated v_d = %.4f | Drude a*tau = %.4f\\n",
                vd_late / nlate, A * TAU);
    return 0;
}
`;

// ============================================================
// 2) PHONON DISPERSION — 1D diatomic chain
// ============================================================

export const PY_PHONON = `"""
Wk02 - Phonon dispersion of a 1D diatomic chain (m1, m2, spring C)
    omega^2 = C(1/m1 + 1/m2) +/- C*sqrt((1/m1+1/m2)^2
                                        - 4 sin^2(ka)/(m1 m2))
Acoustic & optical branches; a band gap opens when m1 != m2.

Run:    python wk02_phonon_dispersion.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt

C = 1.0
m1 = 1.0
ratios = [1.0, 2.0, 4.0]          # m2 / m1
ka = np.linspace(-np.pi / 2, np.pi / 2, 400)

fig, axes = plt.subplots(1, len(ratios), figsize=(11, 3.8), sharey=True)
for ax, r in zip(axes, ratios):
    m2 = r * m1
    s = 1 / m1 + 1 / m2
    root = np.sqrt(s**2 - 4 * np.sin(ka)**2 / (m1 * m2))
    w_ac = np.sqrt(C * (s - root))
    w_op = np.sqrt(C * (s + root))
    ax.plot(ka, w_ac, "b-", lw=2, label="acoustic")
    ax.plot(ka, w_op, "r-", lw=2, label="optical")
    ax.set_title(f"m2/m1 = {r:.0f}")
    ax.set_xlabel("ka")
    gap = np.sqrt(2 * C / min(m1, m2)) - np.sqrt(2 * C / max(m1, m2))
    ax.text(0, np.sqrt(2 * C / m1) * 1.02, f"gap = {gap:.2f}",
            ha="center", fontsize=9)
axes[0].set_ylabel("omega")
axes[0].legend()
plt.suptitle("Diatomic chain: heavier contrast -> wider phonon gap")
plt.tight_layout(); plt.show()
`;

export const ML_PHONON = `% Wk02 - Phonon dispersion of a 1D diatomic chain
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc;

C = 1.0; m1 = 1.0;
ratios = [1, 2, 4];
ka = linspace(-pi/2, pi/2, 400);

figure(1);
for i = 1:numel(ratios)
    m2 = ratios(i) * m1;
    s = 1/m1 + 1/m2;
    root = sqrt(s^2 - 4*sin(ka).^2/(m1*m2));
    w_ac = sqrt(C*(s - root));
    w_op = sqrt(C*(s + root));
    subplot(1, numel(ratios), i);
    plot(ka, w_ac, 'b-', 'LineWidth', 2); hold on;
    plot(ka, w_op, 'r-', 'LineWidth', 2); hold off;
    title(sprintf('m2/m1 = %d', ratios(i)));
    xlabel('ka'); if i == 1, ylabel('\\omega'); end
    legend('acoustic','optical','Location','south');
end
sgtitle('Diatomic chain: mass contrast opens a phonon band gap');
`;

export const JL_PHONON = `# Wk02 - Phonon dispersion of a 1D diatomic chain
# Run: julia wk02_phonon_dispersion.jl   (needs Plots)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Plots

C, m1 = 1.0, 1.0
ratios = [1.0, 2.0, 4.0]
ka = range(-pi/2, pi/2, length=400)

plts = []
for r in ratios
    m2 = r * m1
    s = 1/m1 + 1/m2
    root = sqrt.(s^2 .- 4 .* sin.(ka).^2 ./ (m1*m2))
    w_ac = sqrt.(C .* (s .- root))
    w_op = sqrt.(C .* (s .+ root))
    p = plot(ka, w_ac, lw=2, color=:blue, label="acoustic",
             xlabel="ka", title="m2/m1 = " * string(Int(r)))
    plot!(p, ka, w_op, lw=2, color=:red, label="optical")
    push!(plts, p)
end
display(plot(plts..., layout=(1,3), size=(1000,360),
             plot_title="Mass contrast opens a phonon gap"))
readline()
`;

export const CPP_PHONON = `// Wk02 - Phonon dispersion of a 1D diatomic chain (CSV output)
// Build: g++ -O2 -std=c++17 wk02_phonon_dispersion.cpp -o phonon && ./phonon
// Output: phonon_dispersion.csv (ka, w_ac_r1, w_op_r1, w_ac_r2, ...)
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <cmath>
#include <vector>

int main() {
    const double C = 1.0, M1 = 1.0, PI = 3.14159265358979;
    const std::vector<double> ratios = {1.0, 2.0, 4.0};
    const int N = 200;

    FILE* f = std::fopen("phonon_dispersion.csv", "w");
    std::fprintf(f, "ka");
    for (double r : ratios) std::fprintf(f, ",w_ac_r%g,w_op_r%g", r, r);
    std::fprintf(f, "\\n");

    for (int i = 0; i <= N; ++i) {
        double ka = -PI / 2 + PI * i / N;
        std::fprintf(f, "%.5f", ka);
        for (double r : ratios) {
            double m2 = r * M1;
            double s = 1 / M1 + 1 / m2;
            double root = std::sqrt(s * s
                - 4 * std::sin(ka) * std::sin(ka) / (M1 * m2));
            std::fprintf(f, ",%.5f,%.5f",
                std::sqrt(C * (s - root)), std::sqrt(C * (s + root)));
        }
        std::fprintf(f, "\\n");
    }
    std::fclose(f);
    std::puts("Wrote phonon_dispersion.csv (acoustic & optical branches)");
    return 0;
}
`;

// ============================================================
// 3) WIEDEMANN–FRANZ — kappa / (sigma T) = L for real metals
// ============================================================

export const PY_WF = `"""
Wk02 - Wiedemann-Franz law check with real metal data (293 K)
    kappa / (sigma * T) = L  (Lorenz number, 2.44e-8 V^2/K^2)
Free electrons carry BOTH charge and heat -> the two
conductivities are locked together.

Run:    python wk02_wiedemann_franz.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt

T = 293.0
L0 = 2.44e-8
# metal: (sigma [S/m], kappa [W/m K])
metals = {
    "Ag": (6.30e7, 429), "Cu": (5.96e7, 401), "Au": (4.52e7, 317),
    "Al": (3.77e7, 237), "W":  (1.79e7, 173), "Zn": (1.69e7, 116),
    "Ni": (1.43e7,  91), "Fe": (1.00e7,  80), "Pt": (0.94e7,  72),
    "Pb": (0.455e7, 35),
}

print(f"{'Metal':<6}{'sigma':>10}{'kappa':>8}{'L=k/(sT)':>12}{'L/L0':>7}")
xs, ys = [], []
for name, (s, k) in metals.items():
    Lm = k / (s * T)
    xs.append(s * T * L0); ys.append(k)
    print(f"{name:<6}{s:10.2e}{k:8.0f}{Lm:12.3e}{Lm/L0:7.2f}")

plt.figure(figsize=(6.4, 5))
plt.scatter(xs, ys, s=60, zorder=3)
lim = [0, max(ys) * 1.15]
plt.plot(lim, lim, "r--", lw=2, label="kappa = L0 * sigma * T")
for name, (s, k) in metals.items():
    plt.annotate(name, (s * T * L0, k), textcoords="offset points",
                 xytext=(6, 4), fontsize=9)
plt.xlabel("L0 * sigma * T  [W/m K]")
plt.ylabel("measured kappa [W/m K]")
plt.title("Wiedemann-Franz: one carrier, two currents")
plt.legend(); plt.grid(alpha=0.3)
plt.tight_layout(); plt.show()
`;

export const ML_WF = `% Wk02 - Wiedemann-Franz law with real metal data (293 K)
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc;

T = 293; L0 = 2.44e-8;
names = {'Ag','Cu','Au','Al','W','Zn','Ni','Fe','Pt','Pb'};
sigma = [6.30 5.96 4.52 3.77 1.79 1.69 1.43 1.00 0.94 0.455]*1e7;
kappa = [429 401 317 237 173 116 91 80 72 35];

L = kappa ./ (sigma * T);
fprintf('%-6s %10s %8s %12s %7s\\n','Metal','sigma','kappa','L','L/L0');
for i = 1:numel(names)
    fprintf('%-6s %10.2e %8.0f %12.3e %7.2f\\n', ...
            names{i}, sigma(i), kappa(i), L(i), L(i)/L0);
end

figure(1);
x = L0 * sigma * T;
scatter(x, kappa, 60, 'filled'); hold on;
plot([0 max(kappa)*1.15], [0 max(kappa)*1.15], 'r--', 'LineWidth', 2);
text(x, kappa, names, 'VerticalAlignment','bottom');
hold off; grid on;
xlabel('L_0 \\sigma T [W/m K]'); ylabel('measured \\kappa [W/m K]');
title('Wiedemann-Franz: one carrier, two currents');
`;

export const JL_WF = `# Wk02 - Wiedemann-Franz law with real metal data (293 K)
# Run: julia wk02_wiedemann_franz.jl   (needs Plots)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Plots, Printf

T, L0 = 293.0, 2.44e-8
names = ["Ag","Cu","Au","Al","W","Zn","Ni","Fe","Pt","Pb"]
sigma = [6.30, 5.96, 4.52, 3.77, 1.79, 1.69, 1.43, 1.00, 0.94, 0.455] .* 1e7
kappa = [429.0, 401, 317, 237, 173, 116, 91, 80, 72, 35]

@printf("%-6s %10s %8s %12s %7s\\n", "Metal", "sigma", "kappa", "L", "L/L0")
for i in eachindex(names)
    L = kappa[i] / (sigma[i] * T)
    @printf("%-6s %10.2e %8.0f %12.3e %7.2f\\n",
            names[i], sigma[i], kappa[i], L, L / L0)
end

x = L0 .* sigma .* T
plt = scatter(x, kappa, ms=6, label="metals",
              xlabel="L0*sigma*T [W/m K]", ylabel="kappa [W/m K]",
              title="Wiedemann-Franz: one carrier, two currents",
              series_annotations=text.(names, 8, :bottom))
lim = maximum(kappa) * 1.15
plot!(plt, [0, lim], [0, lim], lw=2, ls=:dash, color=:red,
      label="kappa = L0*sigma*T")
display(plt); readline()
`;

export const CPP_WF = `// Wk02 - Wiedemann-Franz law with real metal data (293 K)
// Build: g++ -O2 -std=c++17 wk02_wiedemann_franz.cpp -o wf && ./wf
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <string>
#include <vector>

struct Metal { std::string name; double sigma, kappa; };

int main() {
    const double T = 293.0, L0 = 2.44e-8;
    std::vector<Metal> metals = {
        {"Ag", 6.30e7, 429}, {"Cu", 5.96e7, 401}, {"Au", 4.52e7, 317},
        {"Al", 3.77e7, 237}, {"W",  1.79e7, 173}, {"Zn", 1.69e7, 116},
        {"Ni", 1.43e7,  91}, {"Fe", 1.00e7,  80}, {"Pt", 0.94e7,  72},
        {"Pb", 0.455e7, 35},
    };
    std::printf("%-6s %10s %8s %12s %7s\\n",
                "Metal", "sigma", "kappa", "L=k/(sT)", "L/L0");
    for (const auto& m : metals) {
        double L = m.kappa / (m.sigma * T);
        std::printf("%-6s %10.2e %8.0f %12.3e %7.2f\\n",
                    m.name.c_str(), m.sigma, m.kappa, L, L / L0);
    }
    std::puts("\\nOne carrier (free electrons) -> charge & heat locked (L ~ L0).");
    return 0;
}
`;

// ============================================================
// 4) PLANCK → STEFAN–BOLTZMANN — spectrum & T^4 integration
// ============================================================

export const PY_PLANCK = `"""
Wk02 - Blackbody radiation: Planck spectrum -> Stefan-Boltzmann
Numerically integrates the Planck spectral exitance over
wavelength and compares to sigma*T^4; marks the Wien peak.

Run:    python wk02_planck_stefan.py
Author: Prof. S. Joon Kwon - SPMDL - SKKU
"""
import numpy as np
import matplotlib.pyplot as plt

h = 6.626e-34; c = 2.998e8; kB = 1.381e-23
SIGMA = 5.670e-8

def planck_lam(lam, T):     # spectral exitance [W/m^2/m]
    x = h * c / (lam * kB * T)
    return 2 * np.pi * h * c**2 / lam**5 / np.expm1(x)

lam = np.logspace(-7.3, -4.3, 2000)    # 50 nm .. 50 um
plt.figure(figsize=(8, 5))
for T in [2000, 3000, 4000, 5000, 5778]:
    B = planck_lam(lam, T)
    P_num = np.trapz(B, lam)
    P_sb = SIGMA * T**4
    lam_max = 2.898e-3 / T
    plt.plot(lam * 1e6, B / 1e12, lw=2,
             label=f"T={T} K (num/SB = {P_num/P_sb:.3f})")
    plt.axvline(lam_max * 1e6, color="gray", ls=":", lw=0.8)
    print(f"T={T:5d} K: trapz = {P_num:.3e}, sigma*T^4 = {P_sb:.3e}, "
          f"ratio = {P_num/P_sb:.4f}, Wien peak = {lam_max*1e6:.2f} um")

plt.axvspan(0.38, 0.75, alpha=0.15, color="yellow", label="visible")
plt.xscale("log")
plt.xlabel("wavelength [um]"); plt.ylabel("exitance [MW/m^2/um]")
plt.title("Planck spectra: area = sigma*T^4 (Stefan-Boltzmann)")
plt.legend(fontsize=8); plt.grid(alpha=0.3)
plt.tight_layout(); plt.show()
`;

export const ML_PLANCK = `% Wk02 - Planck spectrum -> Stefan-Boltzmann (numeric check)
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc;

h = 6.626e-34; c = 2.998e8; kB = 1.381e-23; SB = 5.670e-8;
lam = logspace(-7.3, -4.3, 2000);
Ts = [2000 3000 4000 5000 5778];

figure(1); hold on;
for T = Ts
    x = h*c ./ (lam*kB*T);
    B = 2*pi*h*c^2 ./ lam.^5 ./ (exp(x) - 1);
    P_num = trapz(lam, B);
    P_sb = SB * T^4;
    lam_max = 2.898e-3 / T;
    plot(lam*1e6, B/1e12, 'LineWidth', 2, ...
         'DisplayName', sprintf('T = %d K', T));
    xline(lam_max*1e6, ':', 'Color', [0.5 0.5 0.5]);
    fprintf('T=%5d K: num = %.3e, SB = %.3e, ratio = %.4f\\n', ...
            T, P_num, P_sb, P_num/P_sb);
end
hold off; grid on;
set(gca, 'XScale', 'log');
xlabel('wavelength [\\mum]'); ylabel('exitance [MW/m^2/\\mum]');
title('Planck spectra: area = \\sigmaT^4');
legend('Location','northeast');
`;

export const JL_PLANCK = `# Wk02 - Planck spectrum -> Stefan-Boltzmann (numeric check)
# Run: julia wk02_planck_stefan.jl   (needs Plots)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Plots, Printf

const h = 6.626e-34; const c = 2.998e8
const kB = 1.381e-23; const SB = 5.670e-8

planck(lam, T) = 2pi * h * c^2 / lam^5 / expm1(h * c / (lam * kB * T))

lam = exp10.(range(-7.3, -4.3, length=2000))
plt = plot(xscale=:log10, xlabel="wavelength [um]",
           ylabel="exitance [MW/m^2/um]",
           title="Planck spectra: area = sigma*T^4")
for T in [2000.0, 3000, 4000, 5000, 5778]
    B = planck.(lam, T)
    P_num = sum(0.5 .* (B[1:end-1] .+ B[2:end]) .* diff(lam))  # trapz
    P_sb = SB * T^4
    @printf("T=%5.0f K: num = %.3e, SB = %.3e, ratio = %.4f\\n",
            T, P_num, P_sb, P_num / P_sb)
    plot!(plt, lam .* 1e6, B ./ 1e12, lw=2,
          label="T = " * string(Int(T)) * " K")
end
display(plt); readline()
`;

export const CPP_PLANCK = `// Wk02 - Planck spectrum -> Stefan-Boltzmann (numeric check + CSV)
// Build: g++ -O2 -std=c++17 wk02_planck_stefan.cpp -o planck && ./planck
// Output: planck_spectra.csv (lam_um, B at each T)
// Author: Prof. S. Joon Kwon - SPMDL - SKKU
#include <cstdio>
#include <cmath>
#include <vector>

int main() {
    const double h = 6.626e-34, c = 2.998e8, kB = 1.381e-23;
    const double SB = 5.670e-8, PI = 3.14159265358979;
    const std::vector<double> Ts = {2000, 3000, 4000, 5000, 5778};
    const int N = 2000;

    auto planck = [&](double lam, double T) {
        double x = h * c / (lam * kB * T);
        return 2 * PI * h * c * c / std::pow(lam, 5) / std::expm1(x);
    };

    // log-spaced wavelength grid: 50 nm .. 50 um
    std::vector<double> lam(N);
    for (int i = 0; i < N; ++i)
        lam[i] = std::pow(10.0, -7.3 + 3.0 * i / (N - 1));

    FILE* f = std::fopen("planck_spectra.csv", "w");
    std::fprintf(f, "lam_um");
    for (double T : Ts) std::fprintf(f, ",T%g", T);
    std::fprintf(f, "\\n");
    for (int i = 0; i < N; ++i) {
        std::fprintf(f, "%.5e", lam[i] * 1e6);
        for (double T : Ts) std::fprintf(f, ",%.5e", planck(lam[i], T));
        std::fprintf(f, "\\n");
    }
    std::fclose(f);

    for (double T : Ts) {
        double P = 0.0;
        for (int i = 0; i + 1 < N; ++i)
            P += 0.5 * (planck(lam[i], T) + planck(lam[i + 1], T))
                     * (lam[i + 1] - lam[i]);
        std::printf("T=%5.0f K: num = %.3e, sigma*T^4 = %.3e, "
                    "ratio = %.4f, Wien = %.2f um\\n",
                    T, P, SB * std::pow(T, 4), P / (SB * std::pow(T, 4)),
                    2.898e-3 / T * 1e6);
    }
    return 0;
}
`;
