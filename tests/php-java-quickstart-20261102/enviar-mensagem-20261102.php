<?php
declare(strict_types=1);

// PHP 8+ CLI com as extensões cURL e JSON. Execute somente no seu backend.
// Configure WAFLY_CLIENT_TOKEN, WAFLY_INSTANCE, WAFLY_TOKEN,
// WAFLY_PHONE (DDI + DDD + número, só dígitos) e WAFLY_MESSAGE.
// WAFLY_BASE_URL é opcional; HTTP só é aceito em loopback para testes locais.
// Uma tentativa, timeout total de 15 s e nenhum redirecionamento.
// Timeout/erro deixa o resultado incerto: confira antes de repetir.

function requiredEnv(string $name): string
{
    $value = getenv($name);
    if ($value === false || trim($value) === '') {
        throw new RuntimeException('Configuração ausente.');
    }
    return $value;
}

try {
    if (PHP_VERSION_ID < 80000 || !extension_loaded('curl')) {
        throw new RuntimeException('Runtime incompatível.');
    }
    $clientToken = requiredEnv('WAFLY_CLIENT_TOKEN');
    $instance = requiredEnv('WAFLY_INSTANCE');
    $token = requiredEnv('WAFLY_TOKEN');
    $phone = requiredEnv('WAFLY_PHONE');
    $message = requiredEnv('WAFLY_MESSAGE');
    foreach ([$clientToken, $instance, $token] as $credential) {
        if (preg_match('/[\x00-\x1f\x7f]/', $credential)) {
            throw new RuntimeException('Configuração inválida.');
        }
    }
    if (!preg_match('/\A[0-9]{10,15}\z/', $phone)) {
        throw new RuntimeException('Destinatário inválido.');
    }
    $configuredBase = getenv('WAFLY_BASE_URL');
    $base = rtrim($configuredBase === false ? 'https://wafly.com.br/api-bridge-whats' : $configuredBase, '/');
    $parts = parse_url($base);
    $loopback = is_array($parts) && in_array(strtolower($parts['host'] ?? ''), ['localhost', '127.0.0.1', '[::1]'], true);
    if (!is_array($parts) || empty($parts['host']) || isset($parts['user'])
        || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])
        || !(($parts['scheme'] ?? '') === 'https' || (($parts['scheme'] ?? '') === 'http' && $loopback))) {
        throw new RuntimeException('Base inválida.');
    }
    $url = $base . '/instances/' . rawurlencode($instance) . '/token/' . rawurlencode($token) . '/send-text';
    $payload = json_encode(['phone' => $phone, 'message' => $message], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $curl = curl_init($url);
    if ($curl === false) {
        throw new RuntimeException('Transporte indisponível.');
    }
    try {
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Client-Token: ' . $clientToken, 'Content-Type: application/json'],
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT_MS => 15000,
            CURLOPT_TIMEOUT_MS => 15000,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_MAXREDIRS => 0,
        ]);
        $body = curl_exec($curl); // Uma única chamada; não há loop de retentativa.
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        if ($body === false || $status < 200 || $status >= 300) {
            throw new RuntimeException('Resposta não confirmada.');
        }
    } finally {
        unset($curl); // Em PHP 8, liberar CurlHandle encerra o recurso.
    }
    $data = json_decode($body, false, 512, JSON_THROW_ON_ERROR);
    if (!$data instanceof stdClass || property_exists($data, 'error')
        || (property_exists($data, 'value') && $data->value !== true)
        || !isset($data->messageId) || !is_string($data->messageId)
        || trim($data->messageId) === '' || str_starts_with($data->messageId, 'DUPLICATE_')) {
        throw new RuntimeException('Aceite não confirmado.');
    }
    // Guarde o ID da solicitação. Aceite da API não comprova entrega ou leitura.
    echo json_encode(['messageId' => $data->messageId], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . PHP_EOL;
} catch (Throwable $error) {
    // Nunca imprima a exceção, URL, token ou corpo da requisição/resposta.
    fwrite(STDERR, "Envio não confirmado pela API. O resultado pode ser incerto; confira antes de repetir.\n");
    exit(1);
}
