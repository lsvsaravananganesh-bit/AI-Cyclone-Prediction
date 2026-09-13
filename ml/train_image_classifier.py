"""Trainable baseline for satellite cyclone-stage classification.
Dataset layout: ml/datasets/classification/<class_name>/*.jpg
This is a research baseline; evaluate on held-out storm/time periods before use.
"""
import argparse, json, os
import torch
from torch import nn
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms, models

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--data',default='ml/datasets/classification'); ap.add_argument('--epochs',type=int,default=10); ap.add_argument('--out',default='ml/artifacts/cyclone_classifier.pt'); args=ap.parse_args()
    tfm=transforms.Compose([transforms.Resize((224,224)),transforms.RandomHorizontalFlip(),transforms.ToTensor(),transforms.Normalize([.485,.456,.406],[.229,.224,.225])])
    ds=datasets.ImageFolder(args.data,transform=tfm)
    if len(ds)<4: raise SystemExit('Need at least 4 labelled images.')
    n=max(1,int(len(ds)*.2)); train,valid=random_split(ds,[len(ds)-n,n])
    train_loader=DataLoader(train,batch_size=32,shuffle=True); valid_loader=DataLoader(valid,batch_size=32)
    model=models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    model.fc=nn.Linear(model.fc.in_features,len(ds.classes))
    device='cuda' if torch.cuda.is_available() else 'cpu'; model.to(device)
    opt=torch.optim.AdamW(model.parameters(),lr=2e-4); loss_fn=nn.CrossEntropyLoss()
    for epoch in range(args.epochs):
        model.train(); total=0
        for x,y in train_loader:
            x,y=x.to(device),y.to(device); opt.zero_grad(); loss=loss_fn(model(x),y); loss.backward(); opt.step(); total+=loss.item()
        model.eval(); correct=count=0
        with torch.no_grad():
            for x,y in valid_loader:
                p=model(x.to(device)).argmax(1).cpu(); correct+=(p==y).sum().item(); count+=len(y)
        print(f'epoch={epoch+1} loss={total/max(1,len(train_loader)):.4f} val_accuracy={correct/max(1,count):.4f}')
    os.makedirs(os.path.dirname(args.out),exist_ok=True)
    torch.save({'state_dict':model.state_dict(),'classes':ds.classes,'image_size':224},args.out)
    print(json.dumps({'artifact':args.out,'classes':ds.classes}))
if __name__=='__main__': main()
