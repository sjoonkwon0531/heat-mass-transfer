% Week 3 - Topic 1: 2D Steady-State Heat Conduction (Analytical Fourier Series)
% T(x,y) = (4*T1/pi) * sum_{k=0}^{kmax} exp(-(2k+1)*pi*y/L).*sin((2k+1)*pi*x/L)/(2k+1)
% Reproduces the lecture MATLAB demo: temperature imagesc + quiver flux field.

function week3_topic1_analytical2d
    close all; clc
    L = 1; T1 = 1; kmax = 30;
    xvec = 0:0.01:1; yvec = 0:0.01:1;
    [X, Y] = meshgrid(xvec, yvec);

    % Convergence at the center
    fprintf('Convergence at (0.5L, 0.5L):\n');
    for km = [0 5 10 20 30]
        fprintf('  kmax = %3d -> T/T1 = %.8f\n', km, tempsum(0.5, 0.5, km, T1, L));
    end

    Tmat = zeros(size(X));
    for k = 0:kmax
        n = 2*k + 1;
        Tmat = Tmat + (4*T1/pi) * exp(-n*pi*Y/L) .* sin(n*pi*X/L) / n;
    end

    figure(1); % temperature distribution
    imagesc(xvec, yvec, Tmat); colorbar; colormap('copper'); caxis([0 1]);
    xlabel('x/L'); ylabel('y/L'); title('Temperature distribution (T/T_1)');

    figure(2); % heat flux field
    spacing = 0.01;
    [DX, DY] = gradient(Tmat, spacing);
    quiver(X(1:5:end,1:5:end), Y(1:5:end,1:5:end), ...
           -DX(1:5:end,1:5:end), -DY(1:5:end,1:5:end), 'r'); hold on;
    contour(X, Y, Tmat);
    xlabel('x/L'); ylabel('y/L'); title('Flux distribution (q/k)');

    fprintf('T/T1 at (0.25,0.10) = %.6f\n', tempsum(0.25, 0.10, kmax, T1, L));
    fprintf('T/T1 at (0.50,0.25) = %.6f\n', tempsum(0.50, 0.25, kmax, T1, L));
end

function T = tempsum(x, y, kmax, T1, L)
    T = 0;
    for k = 0:kmax
        n = 2*k + 1;
        T = T + exp(-n*pi*y/L) * sin(n*pi*x/L) / n;
    end
    T = 4*T1/pi * T;
end
