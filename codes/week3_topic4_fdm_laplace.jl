# Week 3 - Topic 4: Numerical Solution of the 2D Laplace Equation by FDM
# 5-point stencil: T[i+1,j] + T[i-1,j] + T[i,j+1] + T[i,j-1] - 4*T[i,j] = 0
# Part 1: classic 4x4 heated plate (top=100, left=75, right=50, bottom=0)
# Part 2: Gauss-Seidel on a 40x40 unit square, top side = 1
# Run: julia week3_topic4_fdm_laplace.jl

using Printf
using LinearAlgebra

# --- Part 1: direct linear-system solve (lecture 9x9 matrix) ---
A = 4.0 * Matrix{Float64}(I, 9, 9)
for r in 1:9
    i = mod(r - 1, 3) + 1          # x-index 1..3
    j = div(r - 1, 3) + 1          # y-index 1..3
    i < 3 && (A[r, r + 1] = -1.0)
    i > 1 && (A[r, r - 1] = -1.0)
    j < 3 && (A[r, r + 3] = -1.0)
    j > 1 && (A[r, r - 3] = -1.0)
end
b = [75.0, 0.0, 50.0, 75.0, 0.0, 50.0, 175.0, 100.0, 150.0]
T = A \ b

println("Part 1: interior temperatures (direct solve)")
for j in 3:-1:1
    @printf("  T(1,%d)=%7.3f  T(2,%d)=%7.3f  T(3,%d)=%7.3f\n",
            j, T[3j - 2], j, T[3j - 1], j, T[3j])
end

# --- Part 2: Gauss-Seidel iteration on a fine grid ---
function gauss_seidel!(T::Matrix{Float64}; tol=1e-6, maxiter=100_000)
    ny, nx = size(T)
    for it in 1:maxiter
        err = 0.0
        for i in 2:ny-1, j in 2:nx-1
            v = 0.25 * (T[i+1, j] + T[i-1, j] + T[i, j+1] + T[i, j-1])
            err = max(err, abs(v - T[i, j]))
            T[i, j] = v
        end
        err < tol && return it
    end
    return maxiter
end

n = 40
U = zeros(n, n)
U[n, :] .= 1.0                     # top row = 1 (normalized)
iters = gauss_seidel!(U)
@printf("\nPart 2: %dx%d grid converged in %d iterations\n", n, n, iters)
@printf("  T at center      = %.6f\n", U[div(n, 2), div(n, 2)])
@printf("  T at (0.5, 0.75) = %.6f\n", U[3 * div(n, 4), div(n, 2)])
