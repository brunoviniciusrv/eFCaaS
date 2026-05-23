-- V3: Seed de dados iniciais — permissões, etiquetas e perfis de usuário padrão

-- =========================================================
-- PERMISSÕES DO SISTEMA (espelham SYSTEM_PERMISSIONS do front)
-- =========================================================
INSERT INTO permissao (nome, descricao, tipo) VALUES
    ('view_dashboard',    'Acesso às estatísticas gerais na página inicial',                   'navigation'),
    ('view_analysis',     'Acesso à tela de análise e verificação de fatos',                  'navigation'),
    ('view_curator',      'Acesso à triagem e conteúdos recebidos',                           'navigation'),
    ('view_admin',        'Acesso às configurações globais do sistema',                        'navigation'),
    ('create_news',       'Capacidade de adicionar manualmente novas notícias para triagem',   'actions'),
    ('manage_received',   'Encaminhar ou excluir sugestões externas',                          'actions'),
    ('manage_triage',     'Organizar e priorizar fila de triagem',                             'actions'),
    ('assign_tasks',      'Designar notícias para checadores específicos',                     'actions'),
    ('perform_analysis',  'Preencher relatórios e buscar evidências',                          'actions'),
    ('review_and_approve','Aprovar, rejeitar ou solicitar retificação de checagens',           'actions'),
    ('admin_users',       'Criar, suspender e editar perfis de usuários',                      'settings'),
    ('admin_permissions', 'Criar e editar perfis de acesso e permissões',                      'settings'),
    ('admin_settings',    'Alterar branding, temas e regras do sistema',                       'settings'),
    ('view_audit_logs',   'Visualizar histórico de atividades de todos os usuários',           'settings'),
    ('view_editor',       'Acesso à redação e edição de matérias e checagens',                 'navigation'),
    ('view_archive',      'Acesso ao arquivo de matérias publicadas e exportação',             'navigation'),
    ('publish_article',   'Capacidade de oficializar a publicação de uma checagem no CMS',     'actions'),
    ('export_article',    'Exportar matérias em formatos HTML, JSON ou TXT',                   'actions')
ON CONFLICT DO NOTHING;

-- =========================================================
-- ETIQUETAS DE CHECAGEM
-- =========================================================
INSERT INTO etiqueta (nome, descricao, cor) VALUES
    ('Verdadeiro',    'A informação é totalmente correta e comprovada.',                              '#22c55e'),
    ('Falso',         'A informação é totalmente incorreta ou inventada.',                            '#ef4444'),
    ('Distorcido',    'A informação tem base real mas foi alterada para enganar.',                    '#f97316'),
    ('Falta Contexto','A informação é verdadeira mas precisa de contexto para não enganar.',          '#3b82f6'),
    ('Exagerado',     'A informação aumenta a realidade de forma desproporcional.',                   '#eab308'),
    ('Subestimado',   'A informação diminui a realidade de forma desproporcional.',                   '#a855f7')
ON CONFLICT DO NOTHING;

-- =========================================================
-- PERFIS DE USUÁRIO (tipos de usuário padrão)
-- =========================================================
INSERT INTO tipo_usuario (nome, descricao) VALUES
    ('Administrador', 'Acesso total a todas as funcionalidades e configurações do sistema.'),
    ('Curador',       'Responsável pela triagem inicial, recebimento de denúncias e distribuição de tarefas.'),
    ('Checador',      'Focado na análise técnica, busca de evidências e preenchimento de relatórios.'),
    ('Editor',        'Revisa o conteúdo final, aprova publicações e pode cadastrar notícias urgentes.')
ON CONFLICT DO NOTHING;

-- =========================================================
-- ASSOCIAÇÃO: perfil → permissões
-- =========================================================

-- Administrador: todas as permissões
INSERT INTO tipo_usuario_permissao (id_tipo_usuario, id_permissao)
SELECT tu.id, p.id
FROM tipo_usuario tu, permissao p
WHERE tu.nome = 'Administrador'
ON CONFLICT DO NOTHING;

-- Curador
INSERT INTO tipo_usuario_permissao (id_tipo_usuario, id_permissao)
SELECT tu.id, p.id
FROM tipo_usuario tu
JOIN permissao p ON p.nome IN (
    'view_dashboard', 'view_curator', 'create_news',
    'manage_received', 'manage_triage', 'assign_tasks'
)
WHERE tu.nome = 'Curador'
ON CONFLICT DO NOTHING;

-- Checador
INSERT INTO tipo_usuario_permissao (id_tipo_usuario, id_permissao)
SELECT tu.id, p.id
FROM tipo_usuario tu
JOIN permissao p ON p.nome IN (
    'view_dashboard', 'view_analysis', 'perform_analysis'
)
WHERE tu.nome = 'Checador'
ON CONFLICT DO NOTHING;

-- Editor
INSERT INTO tipo_usuario_permissao (id_tipo_usuario, id_permissao)
SELECT tu.id, p.id
FROM tipo_usuario tu
JOIN permissao p ON p.nome IN (
    'view_dashboard', 'create_news', 'review_and_approve',
    'view_editor', 'view_archive', 'publish_article', 'export_article'
)
WHERE tu.nome = 'Editor'
ON CONFLICT DO NOTHING;

-- =========================================================
-- USUÁRIO ADMINISTRADOR PADRÃO
-- Senha: Admin@2026! (BCrypt strength 12)
-- ATENÇÃO: troque esta senha imediatamente após o primeiro login em produção.
-- =========================================================
INSERT INTO usuario (nome, email, senha, status, id_tipo_usuario)
SELECT
    'Administrador eFCaaS',
    'admin@efcaas.com',
    '$2a$12$8Q7ZnBjW5xKmL.MnFhVTnuoxf0nA7GjmB9vN3BdUmVlmQNr0sxEHm',
    'A',
    tu.id
FROM tipo_usuario tu
WHERE tu.nome = 'Administrador'
ON CONFLICT (email) DO NOTHING;
