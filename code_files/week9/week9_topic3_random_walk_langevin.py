# Week 9 - Topic 3: Random Walk, Langevin Dynamics and the Diffusivity
# Lecture (Part 1):
#   * Langevin equation (one Cartesian component):
#       dv/dt = -gamma v + sqrt(2 kappa) xi(t),  gamma = 6 pi mu r_p / m,  kappa = (kB T/m) gamma
#       <xi> = 0,  <xi(t) xi(t')> = delta(t - t')
#   * mean-square displacement:
#       <x^2> = (2 kB T/(m gamma)) [ t - (1 - exp(-gamma t))/gamma ]
#       -> ballistic <x^2> ~ (kB T/m) t^2 for t << 1/gamma, diffusive <x^2> ~ 2 D t for t >> 1/gamma
#   * D = kB T/(m gamma)  (Einstein; with gamma = 6 pi mu r/m this is Stokes-Einstein)
#   * Green-Kubo: D = int_0^inf <v(t) v(0)> dt,  <v(t) v(0)> = (kB T/m) exp(-gamma t)
#   * lattice walk in a porous medium: D_eff/D_0 drops with porosity and connectivity (cf. eps^2 rule)
# Units below: m = 1, kB T = 1 (so D = 1/gamma).

import math
import random

random.seed(7)


def langevin_msd(gamma=1.0, dt=0.01, nsteps=2000, nwalk=2000, sample_every=100):
    kappa = gamma                    # kB T/m = 1
    amp = math.sqrt(2 * kappa * dt)
    x = [0.0] * nwalk
    v = [random.gauss(0.0, 1.0) for _ in range(nwalk)]   # equilibrium velocities, <v^2> = kB T/m
    v0 = v[:]
    out = []
    for k in range(1, nsteps + 1):
        for i in range(nwalk):
            v[i] += -gamma * v[i] * dt + amp * random.gauss(0.0, 1.0)
            x[i] += v[i] * dt
        if k % sample_every == 0:
            t = k * dt
            msd = sum(xi * xi for xi in x) / nwalk
            vacf = sum(a * b for a, b in zip(v, v0)) / nwalk
            exact = (2.0 / gamma) * (t - (1 - math.exp(-gamma * t)) / gamma)
            out.append((t, msd, exact, vacf, math.exp(-gamma * t)))
    return out


def porous_walk(porosity, L=64, nwalk=500, nsteps=3000, seed=1):
    """Blind-ant random walk on a periodic square lattice with blocked sites."""
    rng = random.Random(seed)
    open_ = [[rng.random() < porosity for _ in range(L)] for _ in range(L)]
    voids = [(i, j) for i in range(L) for j in range(L) if open_[i][j]]
    if not voids:
        return 0.0
    moves = ((1, 0), (-1, 0), (0, 1), (0, -1))
    msd = 0.0
    for _ in range(nwalk):
        i, j = rng.choice(voids)
        X = Y = 0
        for _ in range(nsteps):
            di, dj = moves[rng.randrange(4)]
            ni, nj = (i + di) % L, (j + dj) % L
            if open_[ni][nj]:
                i, j = ni, nj
                X += di
                Y += dj
        msd += X * X + Y * Y
    # free 2D lattice walk: <r^2> = nsteps (a = tau = 1)  ->  D_eff/D_0 = <r^2>/nsteps
    return msd / nwalk / nsteps


if __name__ == "__main__":
    gamma = 2.0
    print(f"Langevin (m = kBT = 1, gamma = {gamma}): D_theory = 1/gamma = {1/gamma:.3f}")
    print("   t      MSD_sim    MSD_exact   VACF_sim  VACF_exact")
    res = langevin_msd(gamma=gamma)
    for t, msd, ex, va, vex in res[::2]:
        print(f"{t:6.2f}  {msd:9.4f}  {ex:9.4f}   {va:8.4f}  {vex:8.4f}")
    t1, m1 = res[-6][0], res[-6][1]
    t2, m2 = res[-1][0], res[-1][1]
    print(f"Long-time slope D = d<x^2>/dt / 2 = {(m2 - m1) / (t2 - t1) / 2:.3f}  (theory {1/gamma:.3f})")
    print(f"Green-Kubo: int exp(-gamma t) dt = 1/gamma = {1/gamma:.3f}")

    # Stokes-Einstein with real numbers: 1 um sphere in water at 298 K
    kB, T, mu, r = 1.380649e-23, 298.15, 0.89e-3, 0.5e-6
    rho_p = 1050.0
    m = rho_p * 4 / 3 * math.pi * r ** 3
    g = 6 * math.pi * mu * r / m
    print(f"\n1 um bead in water: 1/gamma = {1/g:.2e} s (velocity memory), D = kT/(m gamma) = {kB*T/(m*g):.3e} m^2/s")

    print("\nPorous lattice walk (2D site lattice, periodic):")
    print("  porosity   D_eff/D_0   eps^2")
    for eps in (1.0, 0.9, 0.8, 0.7, 0.6, 0.5):
        r_ = porous_walk(eps)
        print(f"   {eps:4.2f}      {r_:7.3f}    {eps*eps:5.3f}")
    print("  (2D site percolation threshold ~ 0.593: below it the open space no longer spans the lattice)")
