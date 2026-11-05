# Week 11 - Topic 3: Sturm-Liouville Eigenfunctions in a Cylinder - Bessel Functions and the Heated Wire
# Lecture (Part 2):
#   * Sturm-Liouville operator L = (1/w) [d/dx (p d/dx) + q]; self-adjoint with homogeneous BCs
#     -> real eigenvalues, orthogonal eigenfunctions <u_m, u_n> = int u_m u_n w dx = 0 (m != n)
#   * cylinder (w = r, p = r, q = 0): (1/r)(r F')' = -lambda^2 F  ->  F = a J0(lambda r)  (Y0 diverges at r = 0)
#     Type 1  F(1) = 0          : J0(lambda) = 0           lambda = 2.405, 5.520, 8.654, ...
#     Type 2  F'(1) = 0         : J1(lambda) = 0           lambda = 0, 3.832, 7.016, 10.173, ...
#     Type 3  F'(1) + Bi F(1) = 0: lambda J1(lambda) = Bi J0(lambda)
#     normalisation  int_0^1 J0(lambda r)^2 r dr = [J0(lambda)^2 + J1(lambda)^2]/2
#   * Ex 1 (lecture): electrically heated wire, dTheta/dt = (1/r)(r Theta_r)_r + 1,
#     Theta(r,0) = 0, Theta_r(0) = 0, Theta_r(1) + Bi Theta(1) = 0  (finite Fourier transform):
#     Theta = 2 sum_n J1(l_n) J0(l_n r) / (l_n^3 J0(l_n)^2 (1 + (Bi/l_n)^2)) (1 - exp(-l_n^2 t))
#     steady state Theta_ss = 1/(2 Bi) + (1 - r^2)/4
#   Dimensionless: Theta = k (T - T_inf)/(q''' R^2), t = alpha t/R^2, Bi = h R/k.
# Bessel functions from J_n(x) = (1/pi) int_0^pi cos(n s - x sin s) ds (trapezoidal rule), so no
# package is needed (SpecialFunctions.besselj would give the same numbers).
# Run: julia week11_topic3_bessel_cylinder.jl

using Printf

function besselj(n, x; m=200)
    h = pi / m
    s = 0.5 * (cos(0.0) + cos(n * pi - x * sin(pi)))
    for k in 1:m-1
        u = k * h
        s += cos(n * u - x * sin(u))
    end
    return s * h / pi
end

function roots(f; xmax=20.0, dx=0.01)
    out = Float64[]
    x = 1e-9; fx = f(x)
    while x < xmax
        x2 = x + dx; f2 = f(x2)
        if fx * f2 < 0
            a, b = x, x2
            for _ in 1:80
                c = 0.5 * (a + b)
                f(a) * f(c) <= 0 ? (b = c) : (a = c)
            end
            push!(out, 0.5 * (a + b))
        end
        x, fx = x2, f2
    end
    return out
end

function eigenvalues(bc; Bi=1.0, n=4)
    r = bc == 1 ? roots(x -> besselj(0, x)) :
        bc == 2 ? vcat(0.0, roots(x -> besselj(1, x))) :
                  roots(x -> x * besselj(1, x) - Bi * besselj(0, x))
    return r[1:min(n, length(r))]
end

function simpson(f, a, b; n=400)
    h = (b - a) / n
    s = f(a) + f(b)
    for i in 1:n-1
        s += (isodd(i) ? 4 : 2) * f(a + i * h)
    end
    return s * h / 3
end

wire_series(r, t, Bi, lams) = sum(2 * besselj(1, l) * besselj(0, l * r) /
    (l^3 * besselj(0, l)^2 * (1 + (Bi / l)^2)) * (1 - exp(-l^2 * t)) for l in lams)

function wire_fd(tEnd, Bi; N=60)
    dr = 1 / N
    steps = floor(Int, tEnd / (0.2 * dr^2)) + 1
    dt = tEnd / steps
    th = zeros(N); nw = zeros(N)
    for _ in 1:steps
        for i in 1:N
            rw, re, rc = (i - 1) * dr, i * dr, (i - 0.5) * dr
            fw = i > 1 ? rw * (th[i] - th[i-1]) / dr : 0.0
            if i < N
                fe = re * (th[i+1] - th[i]) / dr
            else
                Ts = th[i] / (1 + Bi * dr / 2)
                fe = re * (Ts - th[i]) / (dr / 2)
            end
            nw[i] = th[i] + dt * ((fe - fw) / (rc * dr) + 1.0)
        end
        th .= nw
    end
    return th
end

fmtv(v) = "[" * join([@sprintf("%.4f", x) for x in v], ", ") * "]"

println("=== 1. Eigenvalues for the three boundary-condition types ===")
println("  Type 1 (J0 = 0): ", fmtv(eigenvalues(1)))
println("  Type 2 (J1 = 0): ", fmtv(eigenvalues(2)))
for Bi in (0.1, 1.0, 10.0)
    println(@sprintf("  Type 3, Bi = %4.1f: ", Bi), fmtv(eigenvalues(3; Bi=Bi)))
end

println("\n=== 2. Orthogonality (weight w = r) and normalisation ===")
lam = eigenvalues(1)
for i in 1:3
    print("  ")
    for j in 1:3
        @printf(" %+.6f", simpson(r -> besselj(0, lam[i] * r) * besselj(0, lam[j] * r) * r, 0, 1))
    end
    println()
end
l1 = lam[1]
@printf("  int J0(l1 r)^2 r dr = %.6f, formula (J0^2 + J1^2)/2 = %.6f\n",
        simpson(r -> besselj(0, l1 * r)^2 * r, 0, 1), (besselj(0, l1)^2 + besselj(1, l1)^2) / 2)

println("\n=== 3. Heated wire (Ex 1): series vs finite volume ===")
Bi = 1.0
lams = eigenvalues(3; Bi=Bi, n=30)
for t in (0.05, 0.2, 1.0)
    th = wire_fd(t, Bi)
    @printf("  t = %4.2f: centre series = %.5f, FV = %.5f;  surface series = %.5f\n",
            t, wire_series(0.0, t, Bi, lams), th[1], wire_series(1.0, t, Bi, lams))
end
@printf("  steady state 1/(2Bi) + 1/4 = %.5f; series at t = 10: %.5f\n", 1 / (2Bi) + 0.25, wire_series(0, 10, Bi, lams))
let target = 0.95 * (1 / (2Bi) + 0.25), lo = 0.0, hi = 10.0, mid = 0.0
    for _ in 1:60
        mid = 0.5 * (lo + hi)
        wire_series(0, mid, Bi, lams) < target ? (lo = mid) : (hi = mid)
    end
    @printf("  time to reach 95%% of the steady centre value: t = %.3f  (one-term estimate 3/lambda1^2 = %.3f)\n", mid, 3 / lams[1]^2)
end

println("\n=== 4. Case: thin Pt wire, R = 25 um, in still air ===")
k, alpha, h, q, R = 71.6, 2.5e-5, 300.0, 1e9, 25e-6
Biw = h * R / k
l1w = eigenvalues(3; Bi=Biw, n=1)[1]
@printf("  Bi = hR/k = %.2e -> nearly uniform temperature (lumped), lambda1 = %.4f\n", Biw, l1w)
@printf("  steady rise T - T_inf = q R / (2 h) = %.1f K; time constant R^2/(alpha lambda1^2) = %.2f ms (lumped rho c R/(2h))\n",
        q * R / (2h), R^2 / (alpha * l1w^2) * 1e3)
