# Week 4 - Topic 4: Explicit FDM in Matrix Form - U_{n+1} = D*U_n + dtau*q_n
# dU/dtau = d^2U/dr^2 + q(r,tau), U(0)=U(1)=0, U(r,0)=0
# Lecture demo: dr = 0.01, dtau = dr^2/4 (s = 1/4), q = 100 on [0.45, 0.55],
# tau <= 0.1, T0 = 25 degC -> U_max = 1.7786, T_max = T0*U_max = 44.46 degC
# Run: julia week4_topic4_fdm_matrix.jl

using Printf
using LinearAlgebra

function build_D(m, s)
    D = zeros(m + 1, m + 1)
    for i in 2:m
        D[i, i] = 1 - 2s
        D[i, i + 1] = s
        D[i, i - 1] = s
    end
    D[1, 1] = D[m + 1, m + 1] = 1 - 2s
    D[1, 2] = D[2, 1] = D[m + 1, m] = D[m, m + 1] = s
    return D
end

function run_fdm(; delr=0.01, s=0.25, tau_end=0.1, q0=100.0, band=(0.45, 0.55), eta=0.0)
    delt = s * delr^2
    rvec = 0:delr:1
    m = length(rvec) - 1
    nsteps = round(Int, tau_end / delt)
    qvec = [band[1] - 1e-12 <= r <= band[2] + 1e-12 ? q0 : 0.0 for r in rvec]
    D = build_D(m, s)
    U = zeros(m + 1)
    Umax, tau = 0.0, 0.0
    for _ in 1:nsteps
        q = eta > 0 ? qvec .* exp(-eta * tau) : qvec
        U = D * U .+ delt .* q
        tau += delt
        Umax = max(Umax, maximum(U))
    end
    return collect(rvec), U, Umax
end

# --- Lecture demo: steady source band at the center ---
rvec, U, Umax = run_fdm()
T0 = 25.0
println("Lecture demo: dr = 0.01, dtau = dr^2/4, q = 100 on [0.45, 0.55], tau <= 0.1")
@printf("  U_max = %.4f\n", Umax)
@printf("  T_max = T0 * U_max = %.2f degC   (lecture: 44.46 degC)\n", T0 * Umax)
m = length(rvec) - 1
@printf("  final profile: U(0.25) = %.4f,  U(0.5) = %.4f,  U(0.75) = %.4f\n",
        U[m ÷ 4 + 1], U[m ÷ 2 + 1], U[3m ÷ 4 + 1])

# --- Decaying source, q*exp(-tau) ---
_, _, Umax_d = run_fdm(eta=1.0)
@printf("\nDecaying source q*exp(-tau): U_max = %.4f (T_max = %.2f degC)\n", Umax_d, T0 * Umax_d)

# --- Stability experiment: push s past 1/2 ---
println("\nStability of the explicit scheme (s = dtau/dr^2):")
for s in (0.25, 0.50, 0.51, 0.60)
    _, Uend, _ = run_fdm(delr=0.02, s=s, tau_end=0.1)
    mx = maximum(abs.(Uend))
    note = (all(isfinite, Uend) && mx < 10) ? "stable" : "UNSTABLE (oscillates/diverges)"
    @printf("  s = %4.2f: max|U| at tau=0.1 -> %10.3e  %s\n", s, mx, note)
end
println("  -> s <= 1/2: each node moves toward its neighbors' mean; beyond, it overshoots.")

# sanity: symmetric problem must give a symmetric field
@assert maximum(abs.(U .- reverse(U))) < 1e-12
