# Week 6 - Topic 1: Generalized Fourier Series & the Finite Fourier Transform (FFT)
# Dirichlet-Dirichlet basis Phi_n = sqrt(2) sin(n pi x); a linear PDE becomes
# one ODE per mode: psi_n = <Phi_n, Theta>.
# Demos: Gibbs overshoot for f = 1; transient membrane (steady at t ~ 0.3);
# 2D strip spot values; orthonormality check.
# Run: julia week6_topic1_fft_series.jl

using Printf

function sine_series_of_one(x, N)
    s = 0.0
    for n in 1:N
        s += 2 * (1 - (-1)^n) / (n * pi) * sin(n * pi * x)
    end
    return s
end

function membrane_theta(x, t; nmax=199)
    s = 1.0 - x
    for n in 1:nmax
        s -= 2 * exp(-(n * pi)^2 * t) * sin(n * pi * x) / (n * pi)
    end
    return s
end

function strip_T(x, y; kmax=200, T1=1.0)
    s = 0.0
    for k in 0:kmax-1
        n = 2k + 1
        s += exp(-n * pi * y) * sin(n * pi * x) / n
    end
    return 4T1 / pi * s
end

println("Fourier-sine series of f(x) = 1 (Gibbs ~1.179 = 1 + 2 x 8.95%):")
println("  N      max of partial sum")
for N in (9, 49, 199, 999)
    m = maximum(sine_series_of_one(i / 4000, N) for i in 1:3999)
    @printf("  %4d   %8.4f\n", N, m)
end
println("  -> the overshoot never decays; it only squeezes toward the jump.")

println("\nTransient membrane, Theta(0.5, t) vs steady 0.5:")
println("  t       Theta(0.5,t)   exp(-pi^2 t)")
for t in (0.01, 0.05, 0.1, 0.2, 0.3, 0.5)
    @printf("  %4.2f   %10.4f     %10.4f\n", t, membrane_theta(0.5, t), exp(-pi^2 * t))
end
@printf("  -> exp(-pi^2*0.3) = %.4f ~ 0.05: steady state at t ~ 0.3 L^2/D.\n",
        exp(-pi^2 * 0.3))

println("\n2D strip solution (T1 = 1):")
@printf("  T(0.5, 0.25) = %.6f\n", strip_T(0.5, 0.25))
@printf("  T(0.5, 0.50) = %.6f\n", strip_T(0.5, 0.50))
@printf("  T(0.25, 0.10) = %.6f\n", strip_T(0.25, 0.10))

# orthonormality of sqrt(2) sin(n pi x)
N = 2000
dx = 1 / N
dot23 = sum(2 * sin(2pi * (i + 0.5) * dx) * sin(3pi * (i + 0.5) * dx) * dx for i in 0:N-1)
norm2 = sum(2 * sin(2pi * (i + 0.5) * dx)^2 * dx for i in 0:N-1)
@printf("\nOrthonormality: <Phi_2, Phi_3> = %.2e,  <Phi_2, Phi_2> = %.6f\n", dot23, norm2)

@assert abs(membrane_theta(0.0, 0.2) - 1.0) < 1e-6
@assert abs(membrane_theta(1.0, 0.2)) < 1e-6
