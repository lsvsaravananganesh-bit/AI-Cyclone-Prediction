"""Dual-head ResNet50 architecture from the supplied cyclone project archive."""
try:
    import torch.nn as nn
    import torchvision.models as models

    class CycloneResNetClassifier(nn.Module):
        def __init__(self, num_classes=5):
            super().__init__()
            self.backbone = models.resnet50(weights=None)
            in_features = self.backbone.fc.in_features
            self.backbone.fc = nn.Identity()
            self.classifier = nn.Sequential(
                nn.Linear(in_features, 256), nn.ReLU(), nn.Dropout(0.3), nn.Linear(256, num_classes)
            )
            self.regressor = nn.Sequential(
                nn.Linear(in_features, 128), nn.ReLU(), nn.Linear(128, 2)
            )

        def forward(self, x):
            features = self.backbone(x)
            return self.classifier(features), self.regressor(features)
except ImportError:
    class CycloneResNetClassifier:
        """Placeholder when PyTorch/torchvision is not installed."""
        pass
